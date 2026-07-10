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
import { branchNameContract } from '@assayer/shared/contracts';
import type { BranchName } from '@assayer/shared/contracts';

import { gitExecAdapter } from '../../../adapters/git/exec/git-exec-adapter';

export const gitDetectStableBranchBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<
  { hasGitRepo: false } | { hasGitRepo: true; candidates: BranchName[]; preselected?: BranchName }
> => {
  const inside = await gitExecAdapter({
    args: ['rev-parse', '--is-inside-work-tree'],
    cwd: repoRoot,
  });

  if (inside.exitCode !== 0 || String(inside.stdout).trim() !== 'true') {
    return { hasGitRepo: false };
  }

  const branches = await gitExecAdapter({
    args: ['branch', '--list', 'main', 'master'],
    cwd: repoRoot,
  });

  const parsed = String(branches.stdout)
    .split('\n')
    .map((line) => line.replace('*', '').trim())
    .filter((line) => line.length > 0);

  const present = new Set(parsed);
  const candidates = (['main', 'master'] as const)
    .filter((branch) => present.has(branch))
    .map((branch) => branchNameContract.parse(branch));

  const [preselected] = candidates;

  if (preselected === undefined) {
    return { hasGitRepo: true, candidates: [] };
  }

  return { hasGitRepo: true, candidates, preselected };
};
