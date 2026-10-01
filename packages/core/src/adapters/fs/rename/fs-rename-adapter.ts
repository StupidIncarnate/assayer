/**
 * PURPOSE: Renames (moves) a file or directory on the filesystem
 *
 * USAGE:
 * await fsRenameAdapter({ from: '/repo/.tmp/x', to: '/repo/blob/x' });
 * // Renames the path from source to destination and returns { success: true }
 */
import { rename } from 'fs/promises';

export const fsRenameAdapter = async ({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<void> => {
  await rename(from, to);

};
