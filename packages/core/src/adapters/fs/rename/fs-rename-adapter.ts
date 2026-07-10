/**
 * PURPOSE: Renames (moves) a file or directory on the filesystem
 *
 * USAGE:
 * await fsRenameAdapter({ from: '/repo/.tmp/x', to: '/repo/blob/x' });
 * // Renames the path from source to destination and returns { success: true }
 */
import { rename } from 'fs/promises';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapter = async ({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<AdapterResult> => {
  await rename(from, to);

  return { success: true as const };
};
