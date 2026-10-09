import ts from '#gateway/npm/typescript';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { defaultFillLayerTransformer } from './default-fill-layer-transformer';

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

const PAIR_PROGRAM = ProgramStub({
  code: `declare global {
  interface ReadonlyArray<T> {
    readonly length: number;
  }
}
export const pairSyntax = syntax({
  description: 'a number and an array of numbers',
  code: <T>(a: number, receiver: readonly T[]): number => a + receiver.length,
});
`,
  fileName: 'pair.syntax.ts',
});
const PAIR = syntaxInstancesTransformer({
  syntaxes: PAIR_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: PAIR_PROGRAM.getTypeChecker(),
      declared: {
        description: 'a number and an array of numbers',
        code: (a: number, receiver: readonly number[]) => a + receiver.length,
      },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

describe('defaultFillLayerTransformer', () => {
  it('VALID: {scale, varying: value, plainest: [env, const], enabled: [const]} => the varying fill stays and the anchored hole is a literal leaf', () => {
    const result = SCALE.map((instance) =>
      defaultFillLayerTransformer({
        instance,
        varying: {
          hole: 'value',
          fill: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'external', value: 3 },
        },
        plainest: ['env', 'const'],
        slot: { name: 'body', kind: 'statement', reach: 'call', arm: 'return', marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []), hasParams: true },
        enabled: ['const'],
      }),
    );

    expect(result).toStrictEqual(
      SCALE.map((instance) => ({
        kind: 'node',
        instance,
        holes: {
          value: { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'external', value: 3 },
          factor: { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'literal', value: 2 },
        },
      })),
    );
  });

  it('VALID: {plus, varying: a, plainest: [env, const], enabled: [const]} => the other hole takes the first plainest provenance that is offered', () => {
    const result = PLUS.map((instance) =>
      defaultFillLayerTransformer({
        instance,
        varying: {
          hole: 'a',
          fill: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
        },
        plainest: ['env', 'const'],
        slot: { name: 'body', kind: 'statement', reach: 'call', arm: 'return', marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []), hasParams: true },
        enabled: ['const'],
      }),
    );

    expect(result).toStrictEqual(
      PLUS.map((instance) => ({
        kind: 'node',
        instance,
        holes: {
          a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
          b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: 3 },
        },
      })),
    );
  });

  it('ERROR: {plus, plainest: [env], enabled: [param, literal], slot: module} => throws naming the hole, the slot and the fix', () => {
    expect(() =>
      PLUS.map((instance) =>
        defaultFillLayerTransformer({
          instance,
          varying: {
            hole: 'a',
            fill: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
          },
          plainest: ['env'],
          slot: { name: 'module', kind: 'statement', reach: 'module-load', arm: 'return', marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []), hasParams: false },
          enabled: ['param', 'literal'],
        }),
      ),
    ).toThrow(
      /^No plainest provenance is offered for hole 'b' of 'plus' in slot 'module'\. The slot offers \[literal\] and plainest is \[env\]\. Add a provenance the slot offers to plainest in matrixStatics\.$/u,
    );
  });

  it('VALID: {pair, varying: a, plainest: [env, const], enabled: [env, const], module-load slot} => the array hole skips env and takes const', () => {
    const result = PAIR.map((instance) =>
      defaultFillLayerTransformer({
        instance,
        varying: {
          hole: 'a',
          fill: { kind: 'leaf', owner: 'pair', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
        },
        plainest: ['env', 'const'],
        slot: { name: 'module', kind: 'statement', reach: 'module-load', arm: 'return', marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []), hasParams: false },
        enabled: ['env', 'const'],
      }),
    );

    expect(result).toStrictEqual(
      PAIR.map((instance) => ({
        kind: 'node',
        instance,
        holes: {
          a: { kind: 'leaf', owner: 'pair', hole: 'a', type: 'number', provenance: 'literal', value: 3 },
          receiver: {
            kind: 'leaf',
            owner: 'pair',
            hole: 'receiver',
            type: 'readonly number[]',
            provenance: 'const',
            value: [10, 20, 30],
          },
        },
      })),
    );
  });

  it('VALID: {pair, varying: receiver, plainest: [env, const], module-load slot} => the number hole takes env', () => {
    const result = PAIR.map((instance) =>
      defaultFillLayerTransformer({
        instance,
        varying: {
          hole: 'receiver',
          fill: {
            kind: 'leaf',
            owner: 'pair',
            hole: 'receiver',
            type: 'readonly number[]',
            provenance: 'literal',
            value: [10, 20, 30],
          },
        },
        plainest: ['env', 'const'],
        slot: { name: 'module', kind: 'statement', reach: 'module-load', arm: 'return', marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []), hasParams: false },
        enabled: ['env', 'const'],
      }),
    );

    expect(result).toStrictEqual(
      PAIR.map((instance) => ({
        kind: 'node',
        instance,
        holes: {
          a: { kind: 'leaf', owner: 'pair', hole: 'a', type: 'number', provenance: 'env', value: 3 },
          receiver: {
            kind: 'leaf',
            owner: 'pair',
            hole: 'receiver',
            type: 'readonly number[]',
            provenance: 'literal',
            value: [10, 20, 30],
          },
        },
      })),
    );
  });
});
