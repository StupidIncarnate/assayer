/**
 * PURPOSE: Checks whether a path exists on disk using fs/promises access.
 *
 * USAGE:
 * const found = await fsExistsAdapter({ path: '/repo/src/index.ts' });
 * // Returns true when the path is accessible, false otherwise (never throws)
 */
import { access } from 'fs/promises';

export const fsExistsAdapter = async ({ path }: { path: string }): Promise<boolean> => {
  try {
    await access(path);

    return true;
  } catch (_error: unknown) {
    return false;
  }
};
