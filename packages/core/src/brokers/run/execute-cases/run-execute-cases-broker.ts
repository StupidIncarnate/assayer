/**
 * PURPOSE: Runs Jest programmatically over an assembled run directory — the ONE place Assayer's
 *   wrapped runner is actually invoked. Consumers never touch Jest; the runner is an implementation
 *   detail behind this boundary, which is what keeps it swappable.
 *
 *   The config is INLINE JSON, which constrains the shape: Jest parses it as JSON, so the transformer,
 *   setup file and environment must be file PATHS, never live objects. The three ceremony files at core's
 *   package root (`probe-runtime.js`, `probe-transformer.js`, `harness-registrar.js`) are those paths.
 *   Each is plain JS that loads one typed module and hands the work to it.
 *
 *   `runtime` says which tree those typed modules come from. The `__assayerCoreRuntime` Jest global
 *   carries the whole object to the setup file and the registrar, and the transformer's `options` carry
 *   `probeInjectModule`. A source-tree run also sets the `source` export condition, so a workspace
 *   package that core source imports resolves to its TypeScript too.
 *
 *   `options.analyzerContentHash` is not decoration. ts-jest folds transformer options into its cache
 *   key, so a change to the analyzer invalidates instrumented output BY CONTENT — never by the manual
 *   `version` bump ts-jest's own transformers use, which is the mechanism this project ruled against.
 *
 *   `@assayer/core` is MAPPED to the run-side harness registrar, which is what makes a colocated
 *   harness's registration reach the shim that loaded it. Resolving the package from the harness and
 *   from the shim can land on two installs in a workspace, and two module instances mean a declaration
 *   nobody collected and every supplied input reported missing; one mapped path is one instance. The
 *   mapping is exact — a subpath (`@assayer/core/contracts`) is Assayer's own plumbing and is left alone.
 *
 *   The config is IDENTICAL for every file, and the run's own directory is named as a test-path
 *   PATTERN instead. That is load-bearing, not tidiness. ts-jest keeps one TypeScript compiler per
 *   distinct config and never releases it, so pointing `roots`/`testMatch` at each run's own
 *   directory made every file look like a new project and left a whole compiler behind — measured at
 *   ~370MB per file, which took `assayer unit` over 13 files to 3GB and would OOM a real repo. One
 *   config means one compiler, reused: the same 13 files then cost what one does.
 *
 * USAGE:
 * runExecuteCasesBroker({ runDir, repoRoot, probeDir, runtime, analyzerContentHash });
 * // Returns { passed: true } when every generated case reached the exit derivation predicted
 */
import { runCLI } from '@jest/core';
import { dirname } from '#gateway/node/path';

import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import { testPathPatternTransformer } from '../../../transformers/test-path-pattern/test-path-pattern-transformer';
import { runVerdictContract } from '../../../contracts/run-verdict/run-verdict-contract';
import type { RunVerdict } from '../../../contracts/run-verdict/run-verdict-contract';
import type { CoreRuntime } from '../../../contracts/core-runtime/core-runtime-contract';

export const runExecuteCasesBroker = async ({
  runDir,
  repoRoot,
  probeDir,
  runtime,
  analyzerContentHash,
}: {
  runDir: string;
  repoRoot: string;
  probeDir: string;
  runtime: CoreRuntime;
  analyzerContentHash: string;
}): Promise<RunVerdict> => {
  // The runs PARENT, shared by every file, so the config below never varies between them.
  const runsRoot = dirname(runDir);
  const config = {
    rootDir: repoRoot,
    roots: [runsRoot],
    testEnvironment: 'node',
    // Source tree only. A dist run is what a published install does, and a published core ships no
    // TypeScript for a `source` condition to resolve to.
    ...(runtime.tree === 'source'
      ? { testEnvironmentOptions: { customExportConditions: [...coreRuntimeStatics.sourceExportConditions] } }
      : {}),
    globals: { [coreRuntimeStatics.jestGlobal.name]: runtime },
    setupFiles: [runtime.setupFile],
    testMatch: [`${runsRoot}/**/*.test.js`],
    moduleNameMapper: { '^@assayer/core$': runtime.registrar },
    // No reporters at all: the runner is an implementation detail, and its pass/fail summary reaching
    // a human is a leak of exactly the surface this boundary exists to hide. The verdict is read back
    // from the artifact, so nothing here needs to print.
    reporters: [],
    transform: {
      // ONE entry covering both TypeScript extensions. A `.tsx` entry is analysed surface like any
      // other, so the pattern that selects the subject has to reach it — and the widening is what keeps
      // that true without a second entry, which would be a second config key and a second compiler.
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          diagnostics: false,
          astTransformers: {
            before: [
              {
                path: runtime.astTransformer,
                options: { probeDir, analyzerContentHash, probeInjectModule: runtime.probeInjectModule },
              },
            ],
          },
        },
      ],
    },
  };

  const { results } = await runCLI(
    // `_` and `$0` are yargs' required positionals; Jest's Argv extends them even though nothing here
    // came from a command line. `_` carries the test-path pattern — the one place THIS run is named,
    // which is what lets the config above stay identical between runs.
    {
      _: [String(testPathPatternTransformer({ runDir }))],
      $0: '',
      config: JSON.stringify(config),
      runInBand: true,
      silent: true,
      ci: true,
    },
    [repoRoot],
  );

  return runVerdictContract.parse({ passed: results.success });
};
