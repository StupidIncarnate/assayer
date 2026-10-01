/**
 * PURPOSE: Recursively walks a working-tree directory, skipping node_modules, and returns
 *   the absolute paths of every regular file beneath it — the file universe the compile
 *   pipeline scans for source files.
 *
 * USAGE:
 * await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });
 * // Returns a validated FilePath[]: every file under root, depth-first, node_modules excluded
 */
import { readdirEntries } from '#gateway/node/fs__promises';

export const compileWalkWorkingTreeBroker = async ({
  root,
  dir = root,
}: {
  root: string;
  dir?: string;
}): Promise<string[]> => {
  const entries = await readdirEntries(dir);
  const nested = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      if (entry.kind === 'directory') {
        if (entry.name === 'node_modules') {return [];}
        return compileWalkWorkingTreeBroker({ root, dir: `${dir}/${entry.name}` });
      }
      return [`${dir}/${entry.name}`];
    })
  );
  return nested.flat();
};
