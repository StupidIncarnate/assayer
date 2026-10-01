/**
 * PURPOSE: Plans a stable compile for a repo ref against the last-compiled commit -- resolving the
 *   ref's current commit, skipping entirely when nothing has changed since the previous compile,
 *   and otherwise listing the ref's non-excluded source files with their exact committed content
 *   so the compile pipeline reads only from git, never from the working tree. Assayer HARNESSES are
 *   classified out of the analysed targets by the SAME rule the working-tree plan applies, so a ref's
 *   analysed surface and the working tree's never disagree about what a `*.harness.ts` is.
 *
 * USAGE:
 * await compilePlanStableBroker({ repoRoot: '/repo', ref: 'HEAD', previousCommit: 'abc123' });
 * // Returns { mode: 'skipped', targets: [], harnesses: [] } when previousCommit still matches the
 * // ref's commit, or { mode: 'net-new' | 'incremental', targets: [...], harnesses: [...] } otherwise
 */
import { compilePlanStableResultContract } from '../../../contracts/compile-plan-stable-result/compile-plan-stable-result-contract';
import type { CompilePlanStableResult } from '../../../contracts/compile-plan-stable-result/compile-plan-stable-result-contract';

import { gitResolveCommitBroker } from '../../git/resolve-commit/git-resolve-commit-broker';
import { gitLsTreeBroker } from '../../git/ls-tree/git-ls-tree-broker';
import { gitCatFileBroker } from '../../git/cat-file/git-cat-file-broker';
import { harnessClassifyBroker } from '../../harness/classify/harness-classify-broker';
import { isSourceFileIncludedGuard } from '../../../guards/is-source-file-included/is-source-file-included-guard';

export const compilePlanStableBroker = async ({
  repoRoot,
  ref,
  previousCommit,
  exclude = [],
}: {
  repoRoot: string;
  ref: string;
  previousCommit?: string;
  exclude?: readonly string[];
}): Promise<CompilePlanStableResult> => {
  const currentCommit = await gitResolveCommitBroker({ repoRoot, ref });

  if (previousCommit !== undefined && currentCommit !== undefined && previousCommit === currentCommit) {
    return compilePlanStableResultContract.parse({ mode: 'skipped', targets: [], harnesses: [] });
  }

  const entries = await gitLsTreeBroker({ repoRoot, ref });
  const included = entries.filter((entry) => isSourceFileIncludedGuard({ relPath: entry.relPath, exclude }));
  const planned = await Promise.all(
    included.map(async (entry) => ({
      relPath: entry.relPath,
      content: await gitCatFileBroker({ repoRoot, blobSha: entry.blobSha }),
    })),
  );
  const mode = previousCommit === undefined ? 'net-new' : 'incremental';

  return compilePlanStableResultContract.parse({ mode, ...harnessClassifyBroker({ files: planned }) });
};
