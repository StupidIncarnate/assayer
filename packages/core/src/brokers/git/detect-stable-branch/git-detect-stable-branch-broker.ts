/**
 * PURPOSE: Detects candidate "stable" branches (main/master) for a repo root, used to
 *   preselect the ref a semantic diff compares against. Returns hasGitRepo: false when
 *   the directory isn't inside a git working tree at all.
 *
 * USAGE:
 * await gitDetectStableBranchBroker({ repoRoot: '/repo' });
 * // Returns { hasGitRepo: true, candidates: ['main'], preselected: 'main' },
 * // { hasGitRepo: true, candidates: [] } when neither main nor master exist, or
 * // { hasGitRepo: false } when repoRoot isn't a git working tree
 */

import { gitDetectStableBranchResultContract } from '../../../contracts/git-detect-stable-branch-result/git-detect-stable-branch-result-contract';
import type { GitDetectStableBranchResult } from '../../../contracts/git-detect-stable-branch-result/git-detect-stable-branch-result-contract';
import { GitNotInstalledError, branchList, isInsideWorkTree } from '#gateway/bin/git';

export const gitDetectStableBranchBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<
  GitDetectStableBranchResult
> => {
  const inside = await isInsideWorkTree({ cwd: repoRoot }).catch((error: unknown) => {
    if (error instanceof GitNotInstalledError) {
      return false;
    }
    throw error;
  });

  if (!inside) {
    return gitDetectStableBranchResultContract.parse({ hasGitRepo: false });
  }

  const branches = await branchList({ cwd: repoRoot, patterns: ['main', 'master'] });

  const present = new Set(branches ?? []);
  const candidates = (['main', 'master'] as const)
    .filter((branch) => present.has(branch))
    .map((branch) => branch);

  const [preselected] = candidates;

  if (preselected === undefined) {
    return gitDetectStableBranchResultContract.parse({ hasGitRepo: true, candidates: [] });
  }

  return gitDetectStableBranchResultContract.parse({ hasGitRepo: true, candidates, preselected });
};
