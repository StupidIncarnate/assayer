/**
 * PURPOSE: Where the generator reads its declarations from and where it writes its output. Reach
 * for this instead of writing a folder name, a suffix or a file name in a broker.
 *
 * USAGE:
 * generatorLayoutStatics.declarations.folder;
 * // Returns 'declarations'
 */
export const generatorLayoutStatics = {
  declarations: {
    folder: 'declarations',
    kitSpecifier: '../kit',
    tsconfigFile: 'tsconfig.json',
    containers: { folder: 'containers', suffix: '.container.ts' },
    syntax: { folder: 'syntax', suffix: '.syntax.ts' },
    shims: { folder: 'shims', suffix: '.shim.ts' },
  },
  output: {
    rootSegments: ['smoke-repo', 'packages', 'syntax-repository'],
    sourceFolder: 'src',
    manifestFile: 'specimen-manifest.json',
    refusalsFile: 'REFUSED.md',
    specimenSuffix: '.ts',
    testSuffix: '.test.ts',
    testRelPathPrefix: 'packages/syntax-repository/src',
  },
} as const;
