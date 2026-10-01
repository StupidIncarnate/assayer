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
import { compileModeContract } from '@assayer/shared/contracts';
import type { CompileMode } from '@assayer/shared/contracts';

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
}): Promise<{
  mode: CompileMode;
  targets: { relPath: string; content: string }[];
  harnesses: { relPath: string; content: string }[];
}> => {
  const currentCommit = await gitResolveCommitBroker({ repoRoot, ref });

  if (previousCommit !== undefined && currentCommit !== undefined && previousCommit === currentCommit) {
    return { mode: compileModeContract.parse('skipped'), targets: [], harnesses: [] };
  }

  const entries = await gitLsTreeBroker({ repoRoot, ref });
  const included = entries.filter((entry) => isSourceFileIncludedGuard({ relPath: entry.relPath, exclude }));
  const planned = await Promise.all(
    included.map(async (entry) => ({
      relPath: entry.relPath,
      content: await gitCatFileBroker({ repoRoot, blobSha: entry.blobSha }),
    })),
  );
  const mode = compileModeContract.parse(previousCommit === undefined ? 'net-new' : 'incremental');

  return { mode, ...harnessClassifyBroker({ files: planned }) };
};
