/**
 * PURPOSE: Reads the name of the branch HEAD is on. A detached HEAD reads as `null`, because git
 * prints the literal word `HEAD` there and that is not a branch name. A git failure, such as a
 * folder that is not a repository, throws, so a caller never mistakes it for a detached HEAD.
 * Reach for `resolveRef` instead when the caller needs a commit sha.
 *
 * USAGE:
 * const branch = await currentBranch({ cwd: '/repo/worktrees/foo' });
 * // Returns 'main', or null when HEAD is detached
 */

import { gitRun } from '../git-run/git-run';

export const currentBranch = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], cwd });

  if (exitCode !== 0) {
    throw new Error(
      `git rev-parse --abbrev-ref HEAD failed in ${cwd} with exit code ${String(exitCode)}: ${output}`,
    );
  }

  const trimmed = output.trim();

  if (trimmed.length === 0 || trimmed === 'HEAD') {
    return null;
  }

  return trimmed;
};
