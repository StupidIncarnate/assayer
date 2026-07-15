/**
 * PURPOSE: Sequentially runs each remaining file through runUnitBroker, accumulating the saved
 *   results — the recursion that keeps the parent broker free of a loop.
 *
 *   Sequential by design, not by omission. Each run drives a real Jest (already parallel inside), and
 *   every run writes probe plans keyed by content hash into one shared directory; overlapping runs
 *   would interleave those writes for no gain.
 *
 * USAGE:
 * await runEachLayerBroker({ remaining: ['src/a.ts'], root, cacheDir, coreRoot, analyzerContentHash, results: [] });
 * // Returns one RunResult per file, in the order given
 */
import type { RunResult } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runUnitBroker } from '../unit/run-unit-broker';

export const runEachLayerBroker = async ({
  remaining,
  root,
  cacheDir,
  coreRoot,
  analyzerContentHash,
  results,
}: {
  remaining: readonly string[];
  root: string;
  cacheDir: string;
  coreRoot: string;
  analyzerContentHash: string;
  results: RunResult[];
}): Promise<RunResult[]> => {
  const [relPath, ...rest] = remaining;

  if (relPath === undefined) {
    return results;
  }

  const absPath = `${root}/${relPath}`;
  const source = String(await fsReadFileAdapter({ path: absPath }));

  const result = await runUnitBroker({
    cacheDir,
    coreRoot,
    repoRoot: root,
    relPath,
    absPath,
    source,
    // Content-keyed, never a timestamp: the same bytes give the same runId, so an `assayer detail`
    // link stays stable and re-running a file reuses its directory instead of accreting garbage.
    runId: String(cryptoSha256Adapter({ content: `${relPath}\n${source}` })),
    analyzerContentHash,
  });

  return runEachLayerBroker({
    remaining: rest,
    root,
    cacheDir,
    coreRoot,
    analyzerContentHash,
    results: [...results, result],
  });
};
