/**
 * PURPOSE: Recursively walks a working-tree directory, skipping node_modules, and returns
 *   the absolute paths of every regular file beneath it — the file universe the compile
 *   pipeline scans for source files.
 *
 * USAGE:
 * await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });
 * // Returns a validated FilePath[]: every file under root, depth-first, node_modules excluded
 */
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const compileWalkWorkingTreeBroker = async ({
  root,
  dir = root,
}: {
  root: string;
  dir?: string;
}): Promise<FilePath[]> => {
  const entries = await fsReaddirAdapter({ path: dir });
  const nested = await Promise.all(
    entries.map(async (entry): Promise<FilePath[]> => {
      if (entry.isDirectory) {
        if (entry.name === 'node_modules') {return [];}
        return compileWalkWorkingTreeBroker({ root, dir: `${dir}/${entry.name}` });
      }
      return [filePathContract.parse(`${dir}/${entry.name}`)];
    })
  );
  return nested.flat();
};
