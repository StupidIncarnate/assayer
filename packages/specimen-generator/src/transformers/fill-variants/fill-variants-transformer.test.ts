import ts from '#gateway/npm/typescript';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillVariantsTransformer } from './fill-variants-transformer';

const IF_PROGRAM = ProgramStub({
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
  syntaxes: IF_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: IF_PROGRAM.getTypeChecker(),
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
      declared: { description: 'two numbers added', code: (a: number, b: number) => a + b },
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
      declared: {
        description: 'a number multiplied by a fixed factor',
        code: (value: number, factor: number) => value * factor,
        anchors: { factor: 2 },
      },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const GT_PROGRAM = ProgramStub({
  code: `export const gtSyntax = syntax({
  description: 'a number compared with a limit using >',
  code: (value: number, limit: number): boolean => value > limit,
});
`,
  fileName: 'gt.syntax.ts',
});
const GT = syntaxInstancesTransformer({
  syntaxes: GT_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: GT_PROGRAM.getTypeChecker(),
      declared: { description: 'a number compared with a limit using >', code: (value: number, limit: number) => value > limit },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const SEVEN_PROGRAM = ProgramStub({
  code: `export const sevenSyntax = syntax({
  description: 'the number seven',
  code: (): number => 7,
});
`,
  fileName: 'seven.syntax.ts',
});
const SEVEN = syntaxInstancesTransformer({
  syntaxes: SEVEN_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: SEVEN_PROGRAM.getTypeChecker(),
      declared: { description: 'the number seven', code: () => 7 },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const ARRAY_LENGTH_PROGRAM = ProgramStub({
  code: `declare global {
  interface ReadonlyArray<T> {
    readonly length: number;
  }
}
export const arrayLengthSyntax = syntax({
  description: 'the length of an array of numbers',
  code: <T>(receiver: readonly T[]): number => receiver.length,
});
`,
  fileName: 'array-length.syntax.ts',
});
const ARRAY_LENGTH = syntaxInstancesTransformer({
  syntaxes: ARRAY_LENGTH_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: ARRAY_LENGTH_PROGRAM.getTypeChecker(),
      declared: {
        description: 'the length of an array of numbers',
        code: (receiver: readonly number[]) => receiver.length,
      },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const IF_PLUS_SCALE = IF_NUMBER.flatMap((focus) =>
  PLUS.flatMap((plus) => SCALE.map((scale) => ({ focus, plus, scale }))),
);

describe('fillVariantsTransformer', () => {
  it('VALID: {array-length, depth: 0, module-load slot, enabled: [literal, env, external]} => the array hole is offered literal and external, never env', () => {
    const result = ARRAY_LENGTH.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'statement',
          kind: 'statement',
          reach: 'module-load',
          arm: 'log',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: false,
        },
        instances: [...ARRAY_LENGTH],
        enabled: ['literal', 'env', 'external'],
        plainest: ['param', 'env', 'const'],
        excludedFills: [],
      }),
    );

    expect(result.map((variant) => variant.provenance)).toStrictEqual(['literal', 'external']);
  });

  it('VALID: {if-number, depth: 0, slot with $params, enabled: [const, literal, param, env, external]} => one variant per offered provenance in enabled order, env left out', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...GT, ...IF_NUMBER, ...PLUS, ...SCALE],
        enabled: ['const', 'literal', 'param', 'env', 'external'],
        plainest: ['param', 'env', 'const'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      IF_NUMBER.flatMap((focus) =>
        (['const', 'literal', 'param', 'external'] as const).map((provenance) => ({
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance, value: 3 },
            },
          },
          path: ['cond'],
          provenance,
        })),
      ),
    );
  });

  it('VALID: {if-number, depth: 0, module-load slot, enabled: [param, env]} => only env is offered', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'module',
          kind: 'statement',
          reach: 'module-load',
          arm: 'log',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: false,
        },
        instances: [],
        enabled: ['param', 'env'],
        plainest: ['param', 'env', 'const'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      IF_NUMBER.map((focus) => ({
        tree: {
          kind: 'node',
          instance: focus,
          holes: {
            cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'env', value: 3 },
          },
        },
        path: ['cond'],
        provenance: 'env',
      })),
    );
  });

  it('EMPTY: {if-number, enabled: [], depth: 1} => returns no variants', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 1,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...GT, ...PLUS, ...SCALE],
        enabled: [],
        plainest: ['param'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual([]);
  });

  it('VALID: {plus, slot with $params, enabled: [param, literal]} => the hole that does not vary takes the first plainest provenance the slot offers', () => {
    const result = PLUS.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [],
        enabled: ['param', 'literal'],
        plainest: ['env', 'param', 'const'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      PLUS.flatMap((focus) => [
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'param', value: 3 },
            },
          },
          path: ['a'],
          provenance: 'param',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'param', value: 3 },
            },
          },
          path: ['a'],
          provenance: 'literal',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'param', value: 3 },
            },
          },
          path: ['b'],
          provenance: 'param',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
            },
          },
          path: ['b'],
          provenance: 'literal',
        },
      ]),
    );
  });

  it('VALID: {plus, module-load slot, enabled: [env, literal]} => the hole that does not vary takes env, because param is not offered', () => {
    const result = PLUS.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'module',
          kind: 'statement',
          reach: 'module-load',
          arm: 'log',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: false,
        },
        instances: [],
        enabled: ['env', 'literal'],
        plainest: ['param', 'env', 'const'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      PLUS.flatMap((focus) => [
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'env', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'env', value: 3 },
            },
          },
          path: ['a'],
          provenance: 'env',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'env', value: 3 },
            },
          },
          path: ['a'],
          provenance: 'literal',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'env', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'env', value: 3 },
            },
          },
          path: ['b'],
          provenance: 'env',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'env', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
            },
          },
          path: ['b'],
          provenance: 'literal',
        },
      ]),
    );
  });

  it('ERROR: {plus, slot offers only param, plainest: [env]} => throws naming the hole, the slot and what to change', () => {
    expect(() =>
      PLUS.flatMap((focus) =>
        fillVariantsTransformer({
          focus,
          depth: 0,
          slot: {
            name: 'body',
            kind: 'statement',
            reach: 'call',
            arm: 'return',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: true,
          },
          instances: [],
          enabled: ['param'],
          plainest: ['env'],
          excludedFills: [],
        }),
      ),
    ).toThrow(
      /^No plainest provenance is offered for hole 'b' of 'plus' in slot 'body'\. The slot offers \[param\] and plainest is \[env\]\. Add a provenance the slot offers to plainest in matrixStatics\.$/u,
    );
  });

  it('VALID: {scale with factor anchored to 2} => only value varies, and factor is always a literal leaf holding the anchor', () => {
    const result = SCALE.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [],
        enabled: ['param', 'const'],
        plainest: ['param'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      SCALE.flatMap((focus) => [
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
              factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
            },
          },
          path: ['value'],
          provenance: 'param',
        },
        {
          tree: {
            kind: 'node',
            instance: focus,
            holes: {
              value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'const', value: 3 },
              factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
            },
          },
          path: ['value'],
          provenance: 'const',
        },
      ]),
    );
  });

  it('VALID: {if-number, depth: 1} => nests each expression that returns number and has holes, and skips gt (returns boolean), the focus itself and seven (no holes)', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 1,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...GT, ...IF_NUMBER, ...PLUS, ...SCALE, ...SEVEN],
        enabled: ['param'],
        plainest: ['param'],
        excludedFills: [],
      }),
    );

    expect(result).toStrictEqual(
      IF_PLUS_SCALE.flatMap(({ focus, plus, scale }) => [
            {
              tree: {
                kind: 'node',
                instance: focus,
                holes: {
                  cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 },
                },
              },
              path: ['cond'],
              provenance: 'param',
            },
            {
              tree: {
                kind: 'node',
                instance: focus,
                holes: {
                  cond: {
                    kind: 'node',
                    instance: plus,
                    holes: {
                      a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
                      b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'param', value: 3 },
                    },
                  },
                },
              },
              path: ['cond', 'plus', 'a'],
              provenance: 'param',
            },
            {
              tree: {
                kind: 'node',
                instance: focus,
                holes: {
                  cond: {
                    kind: 'node',
                    instance: plus,
                    holes: {
                      a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
                      b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'param', value: 3 },
                    },
                  },
                },
              },
              path: ['cond', 'plus', 'b'],
              provenance: 'param',
            },
            {
              tree: {
                kind: 'node',
                instance: focus,
                holes: {
                  cond: {
                    kind: 'node',
                    instance: scale,
                    holes: {
                      value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                      factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
                    },
                  },
                },
              },
              path: ['cond', 'scale', 'value'],
              provenance: 'param',
            },
      ]),
    );
  });

  it('VALID: {if-number, depth: 0, same instances} => only the direct variant, with no nesting', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 0,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...GT, ...IF_NUMBER, ...PLUS, ...SCALE, ...SEVEN],
        enabled: ['param'],
        plainest: ['param'],
        excludedFills: [],
      }),
    );

    expect(result.map(({ path, provenance }) => ({ path, provenance }))).toStrictEqual([
      { path: ['cond'], provenance: 'param' },
    ]);
  });

  it('VALID: {if-number, depth: 1, excludedFills: [plus]} => plus is not nested, scale still is', () => {
    const result = IF_NUMBER.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 1,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...GT, ...IF_NUMBER, ...PLUS, ...SCALE],
        enabled: ['param'],
        plainest: ['param'],
        excludedFills: ['plus'],
      }),
    );

    expect(result.map(({ path, provenance }) => ({ path, provenance }))).toStrictEqual([
      { path: ['cond'], provenance: 'param' },
      { path: ['cond', 'scale', 'value'], provenance: 'param' },
    ]);
  });

  it('VALID: {plus focus, instances include plus, depth: 1} => plus never fills its own hole, scale does', () => {
    const result = PLUS.flatMap((focus) =>
      fillVariantsTransformer({
        focus,
        depth: 1,
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        instances: [...PLUS, ...SCALE],
        enabled: ['param'],
        plainest: ['param'],
        excludedFills: [],
      }),
    );

    expect(result.map(({ path, provenance }) => ({ path, provenance }))).toStrictEqual([
      { path: ['a'], provenance: 'param' },
      { path: ['a', 'scale', 'value'], provenance: 'param' },
      { path: ['b'], provenance: 'param' },
      { path: ['b', 'scale', 'value'], provenance: 'param' },
    ]);
  });
});
