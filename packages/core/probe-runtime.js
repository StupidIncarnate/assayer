/**
 * PURPOSE: Jest `setupFiles` entry that installs the `__P` probe runtime onto the test file's global.
 *
 *   It is plain JS at the package root — alongside the barrels — because Jest requires setup files
 *   from disk before any transform runs, so this cannot itself be TypeScript. All the behaviour lives
 *   in `jestProbeRuntimeAdapter`, which is typed and unit-tested; this is only the install.
 *
 *   It must run in setupFiles rather than in the assembled shim's body: module-scope branches fire at
 *   REQUIRE time, so `__P` has to exist before the module under test is ever loaded.
 *
 * USAGE:
 * // jest config: setupFiles: ['<core>/probe-runtime.js']
 */
const { jestProbeRuntimeAdapter } = require('./dist/adapters');

globalThis.__P = jestProbeRuntimeAdapter();
