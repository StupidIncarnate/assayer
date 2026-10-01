/**
 * PURPOSE: Resolves a branch, tag or sha to the commit sha it points at. Returns `null` when git
 * exits non-zero, such as for a ref that does not exist, or prints nothing. `short: true` asks git
 * for its abbreviated sha. Reach for `verifyRef` instead when the caller only needs to know the
 * ref exists, and for `headSha` when it only needs HEAD's full sha.
 *
 * USAGE:
 * const sha = await resolveRef({ cwd: '/repo', ref: 'main' });
 * // Returns '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2', or null when main does not exist
 * const short = await resolveRef({ cwd: '/repo', ref: 'HEAD', short: true });
 * // Returns 'abc1234'
 */

import { gitRun } from '../git-run/git-run';

export const resolveRef = async ({
  cwd,
  ref,
  short,
}: {
  cwd: string;
  ref: string;
  short?: boolean;
}): Promise<string | null> => {
  const args = short === true ? ['rev-parse', '--short', ref] : ['rev-parse', ref];
  const { exitCode, stdout } = await gitRun({ args, cwd });

  if (exitCode !== 0) {
    return null;
  }

  const sha = stdout.trim();
  return sha.length === 0 ? null : sha;
};
