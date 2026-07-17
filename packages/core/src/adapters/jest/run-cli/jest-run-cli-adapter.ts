/**
 * PURPOSE: Runs Jest programmatically over an assembled run directory — the ONE place Assayer's
 *   wrapped runner is actually invoked. Consumers never touch Jest; the runner is an implementation
 *   detail behind this boundary, which is what keeps it swappable.
 *
 *   The config is INLINE JSON, which constrains the shape: Jest parses it as JSON, so the transformer,
 *   setup file and environment must be file PATHS, never live objects. That is why the probe
 *   transformer and runtime exist as real files at the package root.
 *
 *   `options.analyzerContentHash` is not decoration. ts-jest folds transformer options into its cache
 *   key, so a change to the analyzer invalidates instrumented output BY CONTENT — never by the manual
 *   `version` bump ts-jest's own transformers use, which is the mechanism this project ruled against.
 *
 *   The config is IDENTICAL for every file, and the run's own directory is named as a test-path
 *   PATTERN instead. That is load-bearing, not tidiness. ts-jest keeps one TypeScript compiler per
 *   distinct config and never releases it, so pointing `roots`/`testMatch` at each run's own
 *   directory made every file look like a new project and left a whole compiler behind — measured at
 *   ~370MB per file, which took `assayer unit` over 13 files to 3GB and would OOM a real repo. One
 *   config means one compiler, reused: the same 13 files then cost what one does.
 *
 * USAGE:
 * jestRunCliAdapter({ runDir, repoRoot, probeDir, coreRoot, analyzerContentHash });
 * // Returns { passed: true } when every generated case reached the exit derivation predicted
 */
import { runCLI } from '@jest/core';
import { join, dirname } from 'node:path';

import { testPathPatternTransformer } from '../../../transformers/test-path-pattern/test-path-pattern-transformer';
import { runVerdictContract } from '../../../contracts/run-verdict/run-verdict-contract';
import type { RunVerdict } from '../../../contracts/run-verdict/run-verdict-contract';

export const jestRunCliAdapter = async ({
  runDir,
  repoRoot,
  probeDir,
  coreRoot,
  analyzerContentHash,
}: {
  runDir: string;
  repoRoot: string;
  probeDir: string;
  coreRoot: string;
  analyzerContentHash: string;
}): Promise<RunVerdict> => {
  // The runs PARENT, shared by every file, so the config below never varies between them.
  const runsRoot = dirname(runDir);
  const config = {
    rootDir: repoRoot,
    roots: [runsRoot],
    testEnvironment: 'node',
    setupFiles: [join(coreRoot, 'probe-runtime.js')],
    testMatch: [`${runsRoot}/**/*.test.js`],
    // No reporters at all: the runner is an implementation detail, and its pass/fail summary reaching
    // a human is a leak of exactly the surface this boundary exists to hide. The verdict is read back
    // from the artifact, so nothing here needs to print.
    reporters: [],
    transform: {
      '^.+\\.ts$': [
        'ts-jest',
        {
          diagnostics: false,
          astTransformers: {
            before: [{ path: join(coreRoot, 'probe-transformer.js'), options: { probeDir, analyzerContentHash } }],
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
