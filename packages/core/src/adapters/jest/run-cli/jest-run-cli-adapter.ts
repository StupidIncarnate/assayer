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
 * USAGE:
 * jestRunCliAdapter({ runDir, repoRoot, probeDir, coreRoot, analyzerContentHash });
 * // Returns { passed: true } when every generated case reached the exit derivation predicted
 */
import { runCLI } from '@jest/core';
import { join } from 'node:path';

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
  const config = {
    rootDir: repoRoot,
    roots: [runDir],
    testEnvironment: 'node',
    setupFiles: [join(coreRoot, 'probe-runtime.js')],
    testMatch: [`${runDir}/**/*.test.js`],
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
    // came from a command line.
    { _: [], $0: '', config: JSON.stringify(config), runInBand: true, silent: true, ci: true },
    [repoRoot],
  );

  return runVerdictContract.parse({ passed: results.success });
};
