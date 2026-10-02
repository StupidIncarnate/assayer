import { analysisOptionsTransformer } from './analysis-options-transformer';

describe('analysisOptionsTransformer', () => {
  it('EMPTY: {no owning tsconfig, so no options} => returns only the forced strictNullChecks', () => {
    expect(analysisOptionsTransformer({ options: {} })).toStrictEqual({ strictNullChecks: true });
  });

  it('VALID: {analysis options beside path and emit options} => keeps the analysis options and drops the rest', () => {
    expect(
      analysisOptionsTransformer({
        options: {
          target: 9,
          lib: ['lib.es2022.d.ts'],
          strict: true,
          noUncheckedIndexedAccess: true,
          outDir: '/repo/dist',
          baseUrl: '/repo',
          types: ['node'],
          configFilePath: '/repo/tsconfig.json',
        },
      }),
    ).toStrictEqual({
      target: 9,
      lib: ['lib.es2022.d.ts'],
      strict: true,
      noUncheckedIndexedAccess: true,
      strictNullChecks: true,
    });
  });

  it('VALID: {strictNullChecks: false in the owner} => forces it back on', () => {
    expect(analysisOptionsTransformer({ options: { strict: false, strictNullChecks: false } })).toStrictEqual({
      strict: false,
      strictNullChecks: true,
    });
  });

  it('VALID: {an already-projected set} => returns the same set', () => {
    const projected = analysisOptionsTransformer({ options: { target: 9, strict: true } });

    expect(analysisOptionsTransformer({ options: projected })).toStrictEqual(projected);
  });
});
