/**
 * PURPOSE: Resolves the current git branch name for a repo root, falling back to a
 *   `detached-<sha>` placeholder when HEAD is detached and to 'default' when the
 *   directory is not a git repository at all or git is not installed.
 *
 * USAGE:
 * await gitCurrentBranchBroker({ repoRoot: '/repo' });
 * // Returns a validated BranchName, e.g. 'feature-x', 'detached-abc1234', or 'default'
 */

import { gitRun, GitNotInstalledError, resolveRef } from '#gateway/bin/git';

export const gitCurrentBranchBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<string> => {
  try {
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
  } catch (error: unknown) {
    if (error instanceof GitNotInstalledError) {
      return 'default';
    }

    throw error;
  }
};
