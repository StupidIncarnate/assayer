/**
 * PURPOSE: Reads one blob's contents by its sha, exactly as git stored them, with no trimming.
 * The contents are git's stdout alone, so a warning git prints on stderr never lands in them.
 * Nothing is read from the working tree. Returns `null` when git exits non-zero, such as for a sha
 * that names no blob. Reach for `lsTree` first to find the sha of each file at a ref.
 *
 * USAGE:
 * const contents = await catFileBlob({ cwd: '/repo', sha: 'e3b0c442...' });
 * // Returns the blob's text, such as 'hello\n', or null when the blob does not exist
 */

import { gitRun } from '../git-run/git-run';

export const catFileBlob = async ({
  cwd,
  sha,
}: {
  cwd: string;
  sha: string;
}): Promise<string | null> => {
  const { exitCode, stdout } = await gitRun({ args: ['cat-file', 'blob', sha], cwd });

  return exitCode === 0 ? stdout : null;
};
