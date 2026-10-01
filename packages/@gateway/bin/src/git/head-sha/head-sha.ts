/**
 * PURPOSE: Reads the full commit sha HEAD points at. Returns `null` when git exits non-zero or
 * prints nothing. Reach for `resolveRef` instead for any ref other than HEAD, or for a short sha.
 *
 * USAGE:
 * const sha = await headSha({ cwd: '/repo' });
 * // Returns the sha string, or null if HEAD cannot be read
 */

import { gitRun } from '../git-run/git-run';

export const headSha = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', 'HEAD'], cwd });

  if (exitCode !== 0) {
    return null;
  }

  const sha = output.trim();
  return sha.length === 0 ? null : sha;
};
