import ts from '#gateway/npm/typescript';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { renderNodeLayerTransformer } from './render-node-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const EMPTY_FILE = ts.createSourceFile('x.ts', '', ts.ScriptTarget.ES2022, false);

const GT_PROGRAM = ProgramStub({
  code: `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
});
`,
  fileName: 'gt.syntax.ts',
});
const GT_INSTANCES = GT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: GT_PROGRAM.getTypeChecker(),
        declared: { description: 'a value compared with a limit using >', code: () => true },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const NOT_PROGRAM = ProgramStub({
  code: `export const notSyntax = syntax({
  description: 'a negation',
  code: (value: boolean): boolean => !value,
});
`,
  fileName: 'not.syntax.ts',
});
const NOT_INSTANCES = NOT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: NOT_PROGRAM.getTypeChecker(),
        declared: { description: 'a negation', code: () => true },
        origin: 'syntax',
        typeArguments: ['boolean'],
      }),
    ],
  }),
);

const NOOP_PROGRAM = ProgramStub({
  code: `export const noopSyntax = syntax({
  description: 'a statement with no arms',
  code: (value: number): void => {
    void value;
  },
});
`,
  fileName: 'noop.syntax.ts',
});
const NOOP_INSTANCES = NOOP_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: NOOP_PROGRAM.getTypeChecker(),
        declared: { description: 'a statement with no arms', code: () => undefined },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const LENGTH_PROGRAM = ProgramStub({
  code: `export const arrayLengthShim = shim({
  description: 'the number of elements in an array',
  builtin: 'Array.prototype.length',
  form: { kind: 'getter', name: 'length' },
  code: <T>(receiver: readonly T[]): number => receiver.length,
});
`,
  fileName: 'array-length.shim.ts',
});
const LENGTH_INSTANCES = LENGTH_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: LENGTH_PROGRAM.getTypeChecker(),
        declared: {
          description: 'the number of elements in an array',
          builtin: 'Array.prototype.length',
          form: { kind: 'getter', name: 'length' },
          code: () => 0,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

describe('renderNodeLayerTransformer', () => {
  it('VALID: {a param leaf} => returns the identifier and records the parameter in the given maps', () => {
    const params = new Map<string, string>();

    const node = renderNodeLayerTransformer({
      tree: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
      names: new Map(),
      params,
      decls: new Map(),
    });

    expect({ text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE), params: [...params] }).toStrictEqual({
      text: 'value',
      params: [['value', 'number']],
    });
  });

  it('VALID: {gt with a param and a literal} => returns the comparison expression', () => {
    const results = GT_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        renderNodeLayerTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: {
              value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
              limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
            },
          },
          names: new Map(),
          params: new Map(),
          decls: new Map(),
        }),
        instance.syntax.sourceFile,
      ),
    );

    expect(results).toStrictEqual(['value > 5']);
  });

  it('VALID: {not over gt} => places the nested comparison inside the negation with parentheses', () => {
    const results = NOT_INSTANCES.flatMap((notInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        PRINTER.printNode(
          ts.EmitHint.Unspecified,
          renderNodeLayerTransformer({
            tree: {
              kind: 'node',
              instance: notInstance,
              holes: {
                value: {
                  kind: 'node',
                  instance: gtInstance,
                  holes: {
                    value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                    limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                  },
                },
              },
            },
            names: new Map(),
            params: new Map(),
            decls: new Map(),
          }),
          notInstance.syntax.sourceFile,
        ),
      ),
    );

    expect(results).toStrictEqual(['!(value > 5)']);
  });

  it('VALID: {a shim node} => returns the call the shim stands for', () => {
    const results = LENGTH_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        renderNodeLayerTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: {
              receiver: {
                kind: 'leaf',
                owner: 'array-length',
                hole: 'receiver',
                type: 'readonly number[]',
                provenance: 'param',
                value: [10, 20, 30],
              },
            },
          },
          names: new Map(),
          params: new Map(),
          decls: new Map(),
        }),
        EMPTY_FILE,
      ),
    );

    expect(results).toStrictEqual(['receiver.length']);
  });

  it('VALID: {a statement syntax} => returns a block of its statements', () => {
    const results = NOOP_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        renderNodeLayerTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: {
              value: { kind: 'leaf', owner: 'noop', hole: 'value', type: 'number', provenance: 'param', value: 3 },
            },
          },
          names: new Map(),
          params: new Map(),
          decls: new Map(),
        }),
        instance.syntax.sourceFile,
      ),
    );

    expect(results).toStrictEqual(['{\n    void value;\n}']);
  });

  it('ERROR: {gt with no fill for limit} => throws and names the node and the hole', () => {
    expect(() =>
      GT_INSTANCES.map((instance) =>
        renderNodeLayerTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: {
              value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
            },
          },
          names: new Map(),
          params: new Map(),
          decls: new Map(),
        }),
      ),
    ).toThrow(
      /^The node 'gt-number' has no fill for its hole 'limit'\. Give every hole of the node a leaf or a node\.$/u,
    );
  });
});
