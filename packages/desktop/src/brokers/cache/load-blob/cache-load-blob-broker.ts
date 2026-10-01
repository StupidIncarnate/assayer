/**
 * PURPOSE: Loads a single content-addressed cache blob from a repo's `.assayer/cache/` and
 *   validates it against the shared CompiledFileBlob contract.
 *
 * USAGE:
 * const blob = await cacheLoadBlobBroker({
 *   repoPath: '/repo',
 *   contentHash: 'abc123',
 * });
 * // Returns a validated CompiledFileBlob; throws if the file is missing or fails validation.
 */
import { compiledFileBlobContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob } from '@assayer/shared/contracts';

import { readJsonFile } from '#gateway/node/fs__promises';

export const cacheLoadBlobBroker = async ({
  repoPath,
  contentHash,
}: {
  repoPath: string;
  contentHash: string;
}): Promise<CompiledFileBlob> => {
  const raw = await readJsonFile(`${repoPath}/.assayer/cache/blobs/${contentHash}.json`);

  return compiledFileBlobContract.parse(raw);
};
