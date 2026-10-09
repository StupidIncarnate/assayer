import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { ArmReachedError } from '../../errors/arm-reached/arm-reached-error';
import { armReachedTransformer } from './arm-reached-transformer';

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

describe('armReachedTransformer', () => {
  it('VALID: {if with literal cond 3} => returns then', () => {
    const result = IF_NUMBER.map((instance) =>
      armReachedTransformer({
        tree: { kind: 'node', instance, holes: { cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'literal', value: 3 } } },
      }),
    );

    expect(result).toStrictEqual(['then']);
  });

  it('VALID: {if with const cond 0} => returns else', () => {
    const result = IF_NUMBER.map((instance) =>
      armReachedTransformer({
        tree: { kind: 'node', instance, holes: { cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'const', value: 0 } } },
      }),
    );

    expect(result).toStrictEqual(['else']);
  });

  it('VALID: {if whose cond is plus of 3 and 3} => returns then, because the node is evaluated', () => {
    const result = IF_NUMBER.flatMap((outer) =>
      PLUS.map((inner) =>
        armReachedTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              cond: {
                kind: 'node',
                instance: inner,
                holes: { a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 }, b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: 3 } },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual(['then']);
  });

  it('VALID: {if whose cond is plus of 3 and -3} => returns else', () => {
    const result = IF_NUMBER.flatMap((outer) =>
      PLUS.map((inner) =>
        armReachedTransformer({
          tree: {
            kind: 'node',
            instance: outer,
            holes: {
              cond: {
                kind: 'node',
                instance: inner,
                holes: { a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 }, b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: -3 } },
              },
            },
          },
        }),
      ),
    );

    expect(result).toStrictEqual(['else']);
  });

  it('ERROR: {if with a param cond} => throws that the leaf value is not known', () => {
    expect(() =>
      IF_NUMBER.map((instance) =>
        armReachedTransformer({
          tree: { kind: 'node', instance, holes: { cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 } } },
        }),
      ),
    ).toThrow(
      /^The value of if\.cond is not known, because its provenance is 'param'\. Only literal and const leaves have a value the generator can evaluate\. Give this leaf one of those provenances\.$/u,
    );
  });

  it('ERROR: {a leaf as the root} => throws that the root must be the focus syntax', () => {
    expect(() =>
      armReachedTransformer({
        tree: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'literal', value: 3 },
      }),
    ).toThrow(
      /^The root of the tree is the leaf if\.cond, but the root must be the focus syntax\. Pass the tree the planner built for the focus\.$/u,
    );
  });

  it('ERROR: {plus as the focus} => throws that it returned without reaching an arm', () => {
    expect(() =>
      PLUS.map((instance) =>
        armReachedTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: { a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'literal', value: 3 }, b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'literal', value: 3 } },
          },
        }),
      ),
    ).toThrow(/^The focus 'plus' returned without reaching an arm\. Its code must call \$arm on every path\.$/u);
  });

  it('ERROR: {a focus whose code throws a RangeError} => rethrows it', () => {
    expect(() =>
      BOOM.map((instance) =>
        armReachedTransformer({
          tree: { kind: 'node', instance, holes: { n: { kind: 'leaf', owner: 'boom', hole: 'n', type: 'number', provenance: 'literal', value: 3 } } },
        }),
      ),
    ).toThrow(/^boom$/u);
  });
});
