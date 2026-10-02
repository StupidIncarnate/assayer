/**
 * PURPOSE: Lists every blob in a git ref's tree, pairing each entry's repo-relative path with
 *   its blob sha — the raw inventory a ref-to-ref diff walks to find changed files.
 *
 * USAGE:
 * await gitLsTreeBroker({ repoRoot: '/repo', ref: 'HEAD' });
 * // Returns [{ relPath, blobSha }, ...] for every file tracked at that ref.
 * // Rejects with GitNotInstalledError when git itself cannot start.
 */

import { gitLsTreeResultContract } from '../../../contracts/git-ls-tree-result/git-ls-tree-result-contract';
import type { GitLsTreeResult } from '../../../contracts/git-ls-tree-result/git-ls-tree-result-contract';
import { lsTree } from '#gateway/bin/git';

export const gitLsTreeBroker = async ({
  repoRoot,
  ref,
}: {
  repoRoot: string;
  ref: string;
}): Promise<GitLsTreeResult> => {
  const entries = await lsTree({ cwd: repoRoot, ref });

  return gitLsTreeResultContract.parse((entries ?? []).map((entry) => ({
    relPath: entry.path,
    // The blob sha is a plain string because no sha contract exists.
    blobSha: entry.sha,
  })));
};
