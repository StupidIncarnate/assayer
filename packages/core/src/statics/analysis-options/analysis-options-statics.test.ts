import { analysisOptionsStatics } from './analysis-options-statics';

describe('analysisOptionsStatics', () => {
  it('VALID: {the statics} => names the analysis options, the forced option and the resolution options', () => {
    expect(analysisOptionsStatics).toStrictEqual({
      analysis: [
        'target',
        'lib',
        'strict',
        'strictNullChecks',
        'noImplicitAny',
        'noImplicitThis',
        'strictFunctionTypes',
        'strictBindCallApply',
        'strictBuiltinIteratorReturn',
        'useUnknownInCatchVariables',
        'exactOptionalPropertyTypes',
        'noUncheckedIndexedAccess',
      ],
      forced: { strictNullChecks: true },
      resolution: [
        'module',
        'moduleResolution',
        'baseUrl',
        'paths',
        'pathsBasePath',
        'rootDirs',
        'customConditions',
        'moduleSuffixes',
        'allowImportingTsExtensions',
        'allowArbitraryExtensions',
        'resolvePackageJsonExports',
        'resolvePackageJsonImports',
        'resolveJsonModule',
        'typeRoots',
        'types',
        'allowJs',
      ],
    });
  });
});
