/**
 * PURPOSE: Resolves the current git branch name for a repo root, falling back to a
 *   `detached-<sha>` placeholder when HEAD is detached and to 'default' when the
 *   directory is not a git repository at all.
 *
 * USAGE:
 * await gitCurrentBranchBroker({ repoRoot: '/repo' });
 * // Returns a validated BranchName, e.g. 'feature-x', 'detached-abc1234', or 'default'.
 * // Rejects with GitNotInstalledError when git itself cannot start.
 */

import { gitRun, resolveRef } from '#gateway/bin/git';

export const gitCurrentBranchBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<string> => {
  const { exitCode, stdout } = await gitRun({
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    cwd: repoRoot,
  });

  if (exitCode !== 0) {
    return 'default';
  }

  const name = stdout.trim();

  if (name === 'HEAD') {
    const short = await resolveRef({ cwd: repoRoot, ref: 'HEAD', short: true });

    return `detached-${short ?? ''}`;
  }

  return name;
};
