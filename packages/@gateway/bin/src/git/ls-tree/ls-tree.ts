/**
 * PURPOSE: Lists every entry in a ref's tree, recursively, as git stored it at that ref. Each git
 * line reads `<mode> <type> <sha>\t<path>`, and each becomes one record. Only git's stdout is
 * parsed, so a warning git prints on stderr never becomes a record. Nothing is read from the
 * working tree. Returns `null` when git exits non-zero, such as for a ref that does not exist.
 * Reach for `catFileBlob` to read one entry's contents by its sha.
 *
 * USAGE:
 * const entries = await lsTree({ cwd: '/repo', ref: 'HEAD' });
 * // Returns [{ mode: '100644', type: 'blob', sha: 'e3b0c442...', path: 'src/index.ts' }, ...]
 */

import { gitRun } from '../git-run/git-run';

export const lsTree = async ({
  cwd,
  ref,
}: {
  cwd: string;
  ref: string;
}): Promise<{ mode: string; type: string; sha: string; path: string }[] | null> => {
  const { exitCode, stdout } = await gitRun({ args: ['ls-tree', '-r', ref], cwd });

  if (exitCode !== 0) {
    return null;
  }

  return stdout
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [meta = '', path = ''] = line.split('\t');
      const [mode = '', type = '', sha = ''] = meta.split(' ');

      return { mode, type, sha, path };
    });
};
