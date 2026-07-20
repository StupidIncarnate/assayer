/**
 * PURPOSE: Reads a source file's raw text from disk by absolute path — the caller source the
 *   compiled-file view re-parses when it composes cross-file predicates at serve time. Returns
 *   undefined when the file is absent so the panel can fall back to the opaque per-file analysis
 *   instead of surfacing an ENOENT.
 *
 * USAGE:
 * const source = await nodeFsReadSourceAdapter({ absPath: '/repo/src/index.ts' });
 * // Returns the file's FileContents, or undefined when it does not exist.
 */
import { readFile } from 'node:fs/promises';
import { fileContentsContract } from '@assayer/core/contracts';
import type { FileContents } from '@assayer/core/contracts';

export const nodeFsReadSourceAdapter = async ({
  absPath,
}: {
  absPath: string;
}): Promise<FileContents | undefined> => {
  try {
    return fileContentsContract.parse(await readFile(absPath, 'utf8'));
  } catch (_error: unknown) {
    return undefined;
  }
};
