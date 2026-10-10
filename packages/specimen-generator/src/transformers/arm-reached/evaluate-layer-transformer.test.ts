import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { ArmReachedError } from '../../errors/arm-reached/arm-reached-error';
import { evaluateLayerTransformer } from './evaluate-layer-transformer';

const ARMS = ['else', 'then'] as const;

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
      declared: { description: 'an if statement', code: (cond: unknown) => {
      throw new ArmReachedError({ arm: String(ARMS[Number(Boolean(cond))]) });
    } },
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

const PICK_PROGRAM = ProgramStub({
  code: `export const pickSyntax = syntax({
  description: 'a number that reaches an arm',
  code: (n: number): number => n,
});
`,
  fileName: 'pick.syntax.ts',
});
const PICK = syntaxInstancesTransformer({
  syntaxes: PICK_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: PICK_PROGRAM.getTypeChecker(),
      declared: { description: 'a number that reaches an arm', code: () => { throw new ArmReachedError({ arm: 'x' }); } },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const BOOM_PROGRAM = ProgramStub({
  code: `export const boomSyntax = syntax({
  description: 'a number that fails',
  code: (n: number): number => n,
});
`,
  fileName: 'boom.syntax.ts',
});
const BOOM = syntaxInstancesTransformer({
  syntaxes: BOOM_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: BOOM_PROGRAM.getTypeChecker(),
      declared: { description: 'a number that fails', code: () => { throw new RangeError('boom'); } },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

const IF_PICK = IF_NUMBER.flatMap((outer) => PICK.map((inner) => ({ outer, inner })));
const IF_BOOM = IF_NUMBER.flatMap((outer) => BOOM.map((inner) => ({ outer, inner })));

describe('evaluateLayerTransformer', () => {
  it.each(['literal', 'const'] as const)('VALID: {a %s leaf holding 7} => returns 7', (provenance) => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance, value: 7 },
      isFocus: false,
    });

    expect(result).toBe(7);
  });

  it.each(['param', 'env'] as const)('ERROR: {a %s leaf} => throws that the value is not known', (provenance) => {
    expect(() =>
      evaluateLayerTransformer({
        tree: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance, value: 7 },
        isFocus: false,
      }),
    ).toThrow(
      new RegExp(
        `^The value of plus\\.a is not known, because its provenance is '${provenance}'\\. Only literal and const leaves have a value the generator can evaluate\\. Give this leaf one of those provenances\\.$`,
        'u',
      ),
    );
  });

  it('VALID: {an external boolean leaf} => returns false', () => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'not', hole: 'value', type: 'boolean', provenance: 'external', value: true },
      isFocus: false,
    });

    expect(result).toBe(false);
  });

  it('VALID: {an external number leaf} => returns NaN', () => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'external', value: 7 },
      isFocus: false,
    });

    expect(result).toBeNaN();
  });

  it('VALID: {an external string leaf} => returns empty string', () => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'concat', hole: 'a', type: 'string', provenance: 'external', value: 'x' },
      isFocus: false,
    });

    expect(result).toBe('');
  });

  it('VALID: {an external array leaf} => returns empty array', () => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'array-length', hole: 'receiver', type: 'readonly number[]', provenance: 'external', value: [1] },
      isFocus: false,
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {an external maybe-number leaf} => returns undefined', () => {
    const result = evaluateLayerTransformer({
      tree: { kind: 'leaf', owner: 'nullish', hole: 'value', type: 'number | undefined', provenance: 'external', value: 7 },
      isFocus: false,
    });

    expect(result).toBe(undefined);
  });

  it('ERROR: {an external leaf of a type the generator does not list} => throws, naming the leaf and the type', () => {
    expect(() =>
      evaluateLayerTransformer({
        tree: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'bigint', provenance: 'external', value: 7 },
        isFocus: false,
      }),
    ).toThrow(
      /^The external leaf plus\.a has the type 'bigint', and the generator does not know what its external text produces in the test process\. Add the type's value to evaluateLayerTransformer beside its entry in typeListStatics\.$/u,
    );
  });

  it('VALID: {plus of 3 and 4, isFocus: true} => returns the code result 7', () => {
    const result = PLUS.map((instance) =>
      evaluateLayerTransformer({
        tree: {
          kind: 'node',
          instance,
          holes: { a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 }, b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 4 } },
        },
        isFocus: true,
      }),
    );

    expect(result).toStrictEqual([7]);
  });

  it('VALID: {plus whose a is a plus of 1 and 2} => evaluates the inner node first, giving 6', () => {
    const result = PLUS.flatMap((outer) =>
      PLUS.map((inner) =>
        evaluateLayerTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              a: {
                kind: 'node',
                instance: inner,
                holes: { a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 1 }, b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 2 } },
              },
              b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 },
            },
          },
          isFocus: true,
        }),
      ),
    );

    expect(result).toStrictEqual([6]);
  });

  it('ERROR: {plus with no fill for a} => throws naming the node and the hole', () => {
    expect(() =>
      PLUS.map((instance) =>
        evaluateLayerTransformer({
          tree: { kind: 'node', instance, holes: { b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 } } },
          isFocus: true,
        }),
      ),
    ).toThrow(
      /^The node 'plus' has no fill for its hole 'a'\. Give every hole of the node a leaf or a node\.$/u,
    );
  });

  it('ERROR: {the focus reaches an arm} => ArmReachedError reaches the caller', () => {
    expect(() =>
      IF_NUMBER.map((instance) =>
        evaluateLayerTransformer({
          tree: { kind: 'node', instance, holes: { cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'literal', value: 3 } } },
          isFocus: true,
        }),
      ),
    ).toThrow(ArmReachedError);
  });

  it('ERROR: {a node that is not the focus reaches an arm} => throws that only the focus may reach an arm', () => {
    expect(() =>
      IF_PICK.map(({ outer, inner }) =>
        evaluateLayerTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: { cond: { kind: 'node', instance: inner, holes: { n: { kind: 'leaf', owner: 'pick', hole: 'n', type: 'number', provenance: 'literal', value: 3 } } } },
          },
          isFocus: true,
        }),
      ),
    ).toThrow(
      /^The fill 'pick' reached its 'x' arm, but only the focus may reach an arm\. Use a fill whose code returns a value\.$/u,
    );
  });

  it('ERROR: {a node that is not the focus throws a RangeError} => rethrows it', () => {
    expect(() =>
      IF_BOOM.map(({ outer, inner }) =>
        evaluateLayerTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: { cond: { kind: 'node', instance: inner, holes: { n: { kind: 'leaf', owner: 'boom', hole: 'n', type: 'number', provenance: 'literal', value: 3 } } } },
          },
          isFocus: true,
        }),
      ),
    ).toThrow(/^boom$/u);
  });
});
