/**
 * PURPOSE: Lists the entries of a directory, translating each fs Dirent into a validated
 *   DirEntry (name + isDirectory).
 *
 * USAGE:
 * await fsReaddirAdapter({ path: '/repo/pkg' });
 * // Returns a validated readonly DirEntry[] for the directory's immediate children
 */
import { readdir } from 'fs/promises';

import { dirEntryContract } from '../../../contracts/dir-entry/dir-entry-contract';
import type { DirEntry } from '../../../contracts/dir-entry/dir-entry-contract';

export const fsReaddirAdapter = async ({ path }: { path: string }): Promise<readonly DirEntry[]> => {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.map((entry) => dirEntryContract.parse({ name: entry.name, isDirectory: entry.isDirectory() }));
};
