import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillTreeProvenancesTransformer } from './fill-tree-provenances-transformer';

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

describe('fillTreeProvenancesTransformer', () => {
  it('VALID: {a leaf} => returns that leaf provenance', () => {
    const result = fillTreeProvenancesTransformer({
      tree: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'env', value: 3 },
    });

    expect(result).toStrictEqual(['env']);
  });

  it('VALID: {plus node whose tree lists b first} => returns the provenances in the hole order the syntax declares', () => {
    const result = PLUS.flatMap((instance) =>
      fillTreeProvenancesTransformer({
        tree: {
          kind: 'node',
          instance,
          holes: {
            b: { kind: 'leaf', owner: 'plus', hole: 'b', type: 'number', provenance: 'const', value: 4 },
            a: { kind: 'leaf', owner: 'plus', hole: 'a', type: 'number', provenance: 'param', value: 3 },
          },
        },
      }),
    );

    expect(result).toStrictEqual(['param', 'const']);
  });

  it('EMPTY: {plus node with no fill for its holes} => returns no provenances', () => {
    const result = PLUS.flatMap((instance) => fillTreeProvenancesTransformer({ tree: { kind: 'node', instance, holes: {} } }));

    expect(result).toStrictEqual([]);
  });
});
