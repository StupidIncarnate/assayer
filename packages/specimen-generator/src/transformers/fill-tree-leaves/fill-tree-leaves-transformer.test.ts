import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillTreeLeavesTransformer } from './fill-tree-leaves-transformer';

const IF_NUMBER_PROGRAM = ProgramStub({
  code: `export const ifSyntax = syntax({
  description: 'an if statement',
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});
`,
  fileName: 'if.syntax.ts',
});
const IF_NUMBER = syntaxInstancesTransformer({
  syntaxes: IF_NUMBER_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: IF_NUMBER_PROGRAM.getTypeChecker(),
      declared: { description: 'an if statement', code: () => undefined },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const PLUS_PROGRAM = ProgramStub({
  code: `export const plusSyntax = syntax({
  description: 'two numbers added',
  code: (a: number, b: number): number => a + b,
});
`,
  fileName: 'plus.syntax.ts',
});
const PLUS = syntaxInstancesTransformer({
  syntaxes: PLUS_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: PLUS_PROGRAM.getTypeChecker(),
      declared: { description: 'two numbers added', code: () => undefined },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const SCALE_PROGRAM = ProgramStub({
  code: `export const scaleSyntax = syntax({
  description: 'a number multiplied by a fixed factor',
  code: (value: number, factor: number): number => value * factor,
  anchors: { factor: 2 },
});
`,
  fileName: 'scale.syntax.ts',
});
const SCALE = syntaxInstancesTransformer({
  syntaxes: SCALE_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: SCALE_PROGRAM.getTypeChecker(),
      declared: { description: 'a number multiplied by a fixed factor', code: () => undefined, anchors: { factor: 2 } },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

describe('fillTreeLeavesTransformer', () => {
  it('VALID: {a leaf} => returns just that leaf', () => {
    const result = fillTreeLeavesTransformer({
      tree: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 },
    });

    expect(result).toStrictEqual([{ kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 }]);
  });

  it('VALID: {if whose cond is a plus node} => returns the plus leaves in the hole order the syntax declares, though the tree lists b first', () => {
    const result = IF_NUMBER.flatMap((outer) =>
      PLUS.flatMap((inner) =>
        fillTreeLeavesTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              cond: {
                kind: 'node',
                instance: inner,
                holes: {
                  b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: 4 },
                  a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
                },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual([
      { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
      { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: 4 },
    ]);
  });

  it('VALID: {plus with a scale node in a and a leaf in b} => returns leaves depth first', () => {
    const result = PLUS.flatMap((outer) =>
      SCALE.flatMap((inner) =>
        fillTreeLeavesTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              a: {
                kind: 'node',
                instance: inner,
                holes: {
                  value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                  factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
                },
              },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'env', value: 3 },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual([
      { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
      { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
      { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'env', value: 3 },
    ]);
  });

  it('EMPTY: {plus node with no fill for its holes} => returns no leaves', () => {
    const result = PLUS.flatMap((instance) => fillTreeLeavesTransformer({ tree: { kind: 'node', instance, holes: {} } }));

    expect(result).toStrictEqual([]);
  });
});
