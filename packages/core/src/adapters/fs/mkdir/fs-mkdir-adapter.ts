/**
 * PURPOSE: Creates a directory on the filesystem, including any missing parent directories
 *
 * USAGE:
 * await fsMkdirAdapter({ path: '/repo/a/b/c' });
 * // Creates every missing directory in the path and returns { success: true }
 */
import { mkdir } from 'fs/promises';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapter = async ({ path }: { path: string }): Promise<AdapterResult> => {
  await mkdir(path, { recursive: true });

  return { success: true as const };
};
