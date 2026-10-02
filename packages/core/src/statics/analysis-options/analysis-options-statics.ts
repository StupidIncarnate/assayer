/**
 * PURPOSE: Names which of a file's compiler options Assayer reads, by what each one changes. `analysis` lists
 *   the options that change a type the checker reports for one file read on its own: the walk and the harness
 *   type reader run with these from the file's owning tsconfig, and the per-file cache key covers them.
 *   `forced` is set on top of the owner's options for every such read. `resolution` lists the options that
 *   change where an import specifier lands: the resolved, stub and harness indexes key on them.
 *
 *   Reach for this when an option has to join or leave a key. An option on neither list never reaches the
 *   in-memory walk, so a path option (`outDir`, `types`) cannot put an absolute path into a cache key.
 *   `strictNullChecks` is forced because the checker drops `undefined` and `null` from every type when it is
 *   off, but the code still receives them at run time, so a case for them would vanish.
 *
 * USAGE:
 * analysisOptionsStatics.analysis;
 * // ['target', 'lib', 'strict', ...]
 */
export const analysisOptionsStatics = {
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
  forced: {
    strictNullChecks: true,
  },
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
} as const;
