/**
 * PURPOSE: Loads a single content-addressed cache blob from a repo's `.assayer/cache/` and
 *   validates it against the shared CompiledFileBlob contract.
 *
 * USAGE:
 * const blob = await cacheLoadBlobBroker({
 *   repoPath: RepoPathStub({ value: '/repo' }),
 *   contentHash: 'abc123',
 * });
 * // Returns a validated CompiledFileBlob; throws if the file is missing or fails validation.
 */
import { compiledFileBlobContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob } from '@assayer/shared/contracts';

import { nodeFsReadCacheBlobAdapter } from '../../../adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const cacheLoadBlobBroker = async ({
  repoPath,
  contentHash,
}: {
  repoPath: RepoPath;
  contentHash: string;
}): Promise<CompiledFileBlob> => {
  const raw = await nodeFsReadCacheBlobAdapter({ repoPath, contentHash });

  return compiledFileBlobContract.parse(raw);
};
