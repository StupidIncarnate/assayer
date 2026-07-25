/**
 * PURPOSE: The fixed spellings the harness artifact is written in — the package a harness imports from,
 *   the symbol it must import and call, the filename suffix that makes it a candidate, and the two
 *   halves of a declared input's key path (the `inputs` root and the `.` that joins its segments).
 *
 *   One home for all of them because each is written at one end of the pipeline and read at the other.
 *   Discovery is a CONJUNCTION of the suffix and the symbol: the suffix says WHICH source file a harness
 *   applies to, and the imported symbol decides WHETHER the file is a harness at all — which is what
 *   keeps a `*.harness.ts` belonging to some other tool (a Playwright fixture, a Jest harness) silently
 *   out of Assayer's way rather than loaded or errored on. The key path is built by `harness-key-path`
 *   when a case is derived and split back apart by `harness-value` when it runs, and two spellings of one
 *   route is how a case comes to name a key nothing can resolve.
 *
 * USAGE:
 * harnessModuleStatics.fileSuffix;
 * // '.harness.ts'
 */
export const harnessModuleStatics = {
  packageName: '@assayer/core',
  registrar: 'assayerHarness',
  fileSuffix: '.harness.ts',
  inputsRoot: 'inputs',
  keySeparator: '.',
} as const;
