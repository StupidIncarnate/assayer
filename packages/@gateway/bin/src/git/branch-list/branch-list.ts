/**
 * PURPOSE: Lists the local branches whose names match the given patterns, in git's own order. Each
 * line git prints opens with a two-character marker (`* ` for the branch HEAD is on, `+ ` for a
 * branch checked out in another worktree, two spaces otherwise), and this strips it. Returns `null`
 * when git exits non-zero. Reach for `currentBranch` instead when the caller only needs HEAD's branch.
 *
 * USAGE:
 * const branches = await branchList({ cwd: '/repo', patterns: ['main', 'master'] });
 * // Returns ['main'] when only main exists, or [] when neither does
 */

import { gitRun } from '../git-run/git-run';

const MARKER_LENGTH = 2;

export const branchList = async ({
  cwd,
  patterns,
}: {
  cwd: string;
  patterns: readonly string[];
}): Promise<string[] | null> => {
  const { exitCode, stdout } = await gitRun({ args: ['branch', '--list', ...patterns], cwd });

  if (exitCode !== 0) {
    return null;
  }

  return stdout
    .split('\n')
    .map((line) => line.slice(MARKER_LENGTH).trim())
    .filter((name) => name.length > 0);
};
