/**
 * PURPOSE: Creates a directory on the filesystem, including any missing parent directories
 *
 * USAGE:
 * await fsMkdirAdapter({ path: '/repo/a/b/c' });
 * // Creates every missing directory in the path and returns { success: true }
 */
import { mkdir } from 'fs/promises';

export const fsMkdirAdapter = async ({ path }: { path: string }): Promise<void> => {
  await mkdir(path, { recursive: true });

};
