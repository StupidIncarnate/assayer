/**
 * PURPOSE: Resolves the current git branch name for a repo root, falling back to a
 *   `detached-<sha>` placeholder when HEAD is detached and to 'default' when the
 *   directory is not a git repository at all.
 *
 * USAGE:
 * await gitCurrentBranchBroker({ repoRoot: '/repo' });
 * // Returns a validated BranchName, e.g. 'feature-x', 'detached-abc1234', or 'default'
 */
import { branchNameContract } from '@assayer/shared/contracts';
import type { BranchName } from '@assayer/shared/contracts';

import { gitExecAdapter } from '../../../adapters/git/exec/git-exec-adapter';

export const gitCurrentBranchBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<BranchName> => {
  const r = await gitExecAdapter({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], cwd: repoRoot });

  if (r.exitCode !== 0) {
    return branchNameContract.parse('default');
  }

  const name = String(r.stdout).trim();

  if (name === 'HEAD') {
    const short = await gitExecAdapter({ args: ['rev-parse', '--short', 'HEAD'], cwd: repoRoot });

    return branchNameContract.parse(`detached-${String(short.stdout).trim()}`);
  }

  return branchNameContract.parse(name);
};
