/**
 * PURPOSE: Reads a file's raw text contents from disk using fs/promises.
 *
 * USAGE:
 * const contents = await fsReadFileAdapter({ path: '/repo/src/index.ts' });
 * // Returns validated FileContents (branded string); underlying fs errors propagate unmodified.
 */
import { readFile } from 'fs/promises';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({ path }: { path: string }): Promise<FileContents> => {
  const contents = await readFile(path, 'utf8');

  return fileContentsContract.parse(contents);
};
