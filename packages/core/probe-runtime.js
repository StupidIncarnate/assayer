/**
 * PURPOSE: Jest `setupFiles` entry that installs the `__P` probe runtime onto the test file's global.
 *
 *   It is plain JS at the package root because Jest requires setup files from disk before any transform
 *   runs, so this cannot itself be TypeScript. All the behaviour lives in `jestProbeRuntimeAdapter`,
 *   which is typed and unit-tested; this is only the install. The adapter's module path arrives in the
 *   `__assayerCoreRuntime` Jest global, which `jest-run-cli-adapter` sets. That path points into the
 *   same tree, source or dist, that the run's broker was loaded from.
 *
 *   It must run in setupFiles rather than in the assembled shim's body: module-scope branches fire at
 *   REQUIRE time, so `__P` has to exist before the module under test is ever loaded.
 *
 * USAGE:
 * // jest config: setupFiles: ['<core>/probe-runtime.js'], globals: { __assayerCoreRuntime: runtime }
 */
const runtime = globalThis.__assayerCoreRuntime;

if (runtime === undefined) {
  throw new Error(
    "assayer: probe-runtime.js ran without the __assayerCoreRuntime Jest global. jest-run-cli-adapter sets it; this file is only loaded by Assayer's own runner.",
  );
}

const { jestProbeRuntimeAdapter } = require(runtime.probeRuntimeModule);

globalThis.__P = jestProbeRuntimeAdapter();
