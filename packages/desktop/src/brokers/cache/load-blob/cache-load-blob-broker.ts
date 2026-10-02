/**
 * PURPOSE: Loads a single cache blob from a repo's `.assayer/cache/` and validates it against the shared
 *   CompiledFileBlob contract. A blob is named by its file's `analysisHash` (the bytes plus the analysis
 *   options of the owning tsconfig), as the manifest records it.
 *
 * USAGE:
 * const blob = await cacheLoadBlobBroker({
 *   repoPath: '/repo',
 *   analysisHash: 'abc123',
 * });
 * // Returns a validated CompiledFileBlob; throws if the file is missing or fails validation.
 */
import { compiledFileBlobContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob } from '@assayer/shared/contracts';

import { readJsonFile } from '#gateway/node/fs__promises';

export const cacheLoadBlobBroker = async ({
  repoPath,
  analysisHash,
}: {
  repoPath: string;
  analysisHash: string;
}): Promise<CompiledFileBlob> => {
  const raw = await readJsonFile(`${repoPath}/.assayer/cache/blobs/${analysisHash}.json`);

  return compiledFileBlobContract.parse(raw);
};
