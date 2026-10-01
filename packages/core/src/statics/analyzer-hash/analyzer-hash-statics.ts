/**
 * PURPOSE: The file-name rules that decide which files under one analyzer root count toward the
 *   analyzer hash, the `assayerVersion` a cache manifest is keyed on. The hash covers only code that
 *   runs, so these rules mirror what each package's `tsconfig.build.json` leaves out of `dist`.
 *
 *   `source` names what a TypeScript source root drops on top of test-named files: test-support
 *   infixes (a proxy or a stub never runs outside a test), declaration files (types only, no code),
 *   and the scratch folders a test writes into. `dist` names the one extension a compiled root keeps:
 *   emitted JavaScript, never a `.d.ts` or a source map. A harness file is dropped through
 *   `harnessModuleStatics.fileSuffix`, its one home.
 *
 * USAGE:
 * analyzerHashStatics.source.testSupportInfixes;
 * // ['.proxy.', '.stub.']
 */
export const analyzerHashStatics = {
  source: {
    testSupportInfixes: ['.proxy.', '.stub.'],
    declarationSuffix: '.d.ts',
    scratchFolders: ['.test-tmp', '_lint-testbed'],
  },
  dist: {
    codeExtension: '.js',
  },
} as const;
