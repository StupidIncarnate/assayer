import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../../transformers/syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../../transformers/syntax-shape/syntax-shape-transformer';
import { hasAllLiteralNodeGuard } from './has-all-literal-node-guard';

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

describe('hasAllLiteralNodeGuard', () => {
  it('EMPTY: {no tree} => returns false', () => {
    const result = hasAllLiteralNodeGuard({});

    expect(result).toBe(false);
  });

  it('VALID: {a literal leaf} => returns false, because a leaf is not a node', () => {
    const result = hasAllLiteralNodeGuard({
      tree: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
    });

    expect(result).toBe(false);
  });

  it('VALID: {plus with literal a and literal b} => returns true', () => {
    const result = PLUS.map((instance) =>
      hasAllLiteralNodeGuard({
        tree: {
          kind: 'node',
          instance,
          holes: {
            a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
            b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
          },
        },
      }),
    );

    expect(result).toStrictEqual([true]);
  });

  it.each(['param', 'env', 'const', 'external'] as const)(
    'VALID: {plus with literal a and %s b} => returns false',
    (provenance) => {
      const result = PLUS.map((instance) =>
        hasAllLiteralNodeGuard({
          tree: {
            kind: 'node',
            instance,
            holes: {
              a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance, value: 3 },
            },
          },
        }),
      );

      expect(result).toStrictEqual([false]);
    },
  );

  it('VALID: {if whose cond is a plus with literal a and literal b} => returns true, because the inner node has only literals', () => {
    const result = IF_NUMBER.flatMap((outer) =>
      PLUS.map((inner) =>
        hasAllLiteralNodeGuard({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              cond: {
                kind: 'node',
                instance: inner,
                holes: {
                  a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
                  b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
                },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual([true]);
  });

  it('VALID: {if whose cond is a plus with param a and literal b} => returns false', () => {
    const result = IF_NUMBER.flatMap((outer) =>
      PLUS.map((inner) =>
        hasAllLiteralNodeGuard({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              cond: {
                kind: 'node',
                instance: inner,
                holes: {
                  a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
                  b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
                },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual([false]);
  });
});
