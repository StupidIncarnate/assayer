/**
 * PURPOSE: Runs the derived cases for a set of files and returns their saved results — the seam the
 *   CLI calls, and the only one it needs.
 *
 *   It exists so no surface has to assemble a run itself. Locating core's own package root (where the
 *   runner's ceremony files and run-time modules live) and fingerprinting the analyzer are facts about
 *   ASSAYER, not about the caller: a CLI that had to know them would be a second place to get them
 *   wrong, and the desktop would then be a third.
 *
 * USAGE:
 * await runPathsBroker({ configDir: '/repo', root: '/repo', relPaths: ['src/a.ts'], analyzerRoots: [...] });
 * // Returns one RunResult per file, each already saved under .assayer/cache/runs/<runId>
 */
import type { RunResult } from '@assayer/shared/contracts';

import { findUpSync } from '#gateway/node/fs';
import { dirname } from '#gateway/node/path';
import { analyzerHashBroker } from '../../analyzer/hash/analyzer-hash-broker';
import { runEachLayerBroker } from './run-each-layer-broker';

export const runPathsBroker = async ({
  configDir,
  root,
  relPaths,
  analyzerRoots,
}: {
  configDir: string;
  root: string;
  relPaths: readonly string[];
  analyzerRoots: readonly string[];
}): Promise<RunResult[]> => {
  // `probe-runtime.js` sits at core's package root and is never compiled into dist, so finding it
  // finds the package whether this module runs from src (ts-jest, tsx) or from dist.
  const runtimeFile = findUpSync({ startDir: __dirname, fileName: 'probe-runtime.js' });

  if (runtimeFile === null) {
    throw new Error(
      `assayer: cannot locate the @assayer/core package root — no probe-runtime.js in any ancestor of ${__dirname}. ` +
        'The install is incomplete; reinstall @assayer/core.',
    );
  }

  const analyzerContentHash = await analyzerHashBroker({ roots: [...analyzerRoots] });

  return runEachLayerBroker({
    remaining: relPaths,
    root,
    cacheDir: `${configDir}/.assayer/cache`,
    coreRoot: dirname(runtimeFile),
    analyzerContentHash,
    results: [],
  });
};
