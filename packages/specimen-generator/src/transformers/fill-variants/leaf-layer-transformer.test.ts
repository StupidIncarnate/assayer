import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { leafLayerTransformer } from './leaf-layer-transformer';

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

const NOT_PROGRAM = ProgramStub({
  code: `export const notSyntax = syntax({ description: 'a negation', code: (value: boolean): boolean => !value });\n`,
  fileName: 'not.syntax.ts',
});
const NOT = syntaxInstancesTransformer({
  syntaxes: NOT_PROGRAM.getSourceFiles().map((sourceFile) =>
    syntaxShapeTransformer({
      sourceFile,
      checker: NOT_PROGRAM.getTypeChecker(),
      declared: { description: 'a negation', code: (value: boolean) => !value },
      origin: 'syntax',
      typeArguments: ['number'],
    }),
  ),
});

describe('leafLayerTransformer', () => {
  it('VALID: {scale, provenance: param} => an unanchored hole holds the known value of its type and an anchored hole holds its anchor', () => {
    const result = SCALE.flatMap((instance) =>
      instance.holes.map((hole) => leafLayerTransformer({ instance, hole, provenance: 'param' })),
    );

    expect(result).toStrictEqual([
      { kind: 'leaf', owner: 'scale', hole: 'value', type: 'number', provenance: 'param', value: 3 },
      { kind: 'leaf', owner: 'scale', hole: 'factor', type: 'number', provenance: 'param', value: 2 },
    ]);
  });

  it('VALID: {not, provenance: external} => a boolean hole holds true', () => {
    const result = NOT.flatMap((instance) =>
      instance.holes.map((hole) => leafLayerTransformer({ instance, hole, provenance: 'external' })),
    );

    expect(result).toStrictEqual([
      { kind: 'leaf', owner: 'not', hole: 'value', type: 'boolean', provenance: 'external', value: true },
    ]);
  });
});
