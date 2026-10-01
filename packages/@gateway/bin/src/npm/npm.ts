/**
 * PURPOSE: Curated surface for the `npm` binary. Every function is built on
 * `#gateway/node/child_process`'s `run` and throws `NpmNotInstalledError` when npm itself is
 * missing.
 *
 * USAGE:
 * import { runBuild, npmRun, NpmNotInstalledError } from '#gateway/bin/npm';
 */

export { NpmNotInstalledError } from './npm-run/npm-not-installed.error';
export { npmRun } from './npm-run/npm-run';
export { runBuild } from './run-build/run-build';
