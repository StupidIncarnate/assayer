/**
 * PURPOSE: Removes a file or directory (and everything under it) from the filesystem
 *
 * USAGE:
 * await fsRmAdapter({ path: '/repo/cache' });
 * // Removes the path recursively without throwing if it does not exist, returns { success: true }
 */
import { rm } from 'fs/promises';

export const fsRmAdapter = async ({ path }: { path: string }): Promise<void> => {
  await rm(path, { recursive: true, force: true });

};
