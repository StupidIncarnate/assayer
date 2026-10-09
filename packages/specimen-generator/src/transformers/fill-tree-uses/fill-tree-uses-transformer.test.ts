import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillTreeUsesTransformer } from './fill-tree-uses-transformer';

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

const IF_PLUS_SCALE = IF_NUMBER.flatMap((outer) =>
  PLUS.flatMap((middle) => SCALE.map((inner) => ({ outer, middle, inner }))),
);

describe('fillTreeUsesTransformer', () => {
  it('EMPTY: {a leaf} => returns no names', () => {
    const result = fillTreeUsesTransformer({
      tree: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 },
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {if with a leaf cond} => returns only the focus name', () => {
    const result = IF_NUMBER.flatMap((instance) =>
      fillTreeUsesTransformer({
        tree: { kind: 'node', instance, holes: { cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 } } },
      }),
    );

    expect(result).toStrictEqual(['if']);
  });

  it('VALID: {if whose cond is a plus whose b is a scale} => returns the focus first, then each name as it is first seen', () => {
    const result = IF_PLUS_SCALE.flatMap(({ outer, middle, inner }) =>
      fillTreeUsesTransformer({
        tree: {
          kind: 'node',
          instance: outer,
          holes: {
            cond: {
              kind: 'node',
              instance: middle,
              holes: {
                a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
                b: {
                  kind: 'node',
                  instance: inner,
                  holes: {
                    value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                    factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
                  },
                },
              },
            },
          },
        },
      }),
    );

    expect(result).toStrictEqual(['if', 'plus', 'scale']);
  });

  it('VALID: {plus whose a and b are both scale nodes} => lists scale once', () => {
    const result = PLUS.flatMap((outer) =>
      SCALE.flatMap((inner) =>
        fillTreeUsesTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              a: {
                kind: 'node',
                instance: inner,
                holes: { value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 }, factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 } },
              },
              b: {
                kind: 'node',
                instance: inner,
                holes: { value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'env', value: 3 }, factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 } },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual(['plus', 'scale']);
  });

  it('EDGE: {plus node with no fill for its holes} => returns only the node name', () => {
    const result = PLUS.flatMap((instance) => fillTreeUsesTransformer({ tree: { kind: 'node', instance, holes: {} } }));

    expect(result).toStrictEqual(['plus']);
  });
});
