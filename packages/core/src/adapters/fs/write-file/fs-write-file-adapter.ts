/**
 * PURPOSE: Writes text content to a file on disk using fs/promises.
 *
 * USAGE:
 * await fsWriteFileAdapter({ path: '/repo/out.ts', content: 'export const x = 1;' });
 * // Writes the content to disk and returns { success: true }
 */
import { writeFile } from 'fs/promises';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  path,
  content,
}: {
  path: string;
  content: string;
}): Promise<AdapterResult> => {
  await writeFile(path, content);

  return { success: true as const };
};
