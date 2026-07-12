/**
 * PURPOSE: Resolves a single compiled file's view (source lines + map nodes) from the cache,
 *   for the current (commitless) namespace of a target repo.
 *
 * USAGE:
 * const view = await compiledFileResolveBroker({
 *   repoPath: RepoPathStub({ value: '/repo' }),
 *   relPath: RelPathStub({ value: 'src/index.ts' }),
 * });
 * // Returns a validated CompiledFileView; throws if relPath is not in the current namespace.
 */
import { compiledFileViewContract } from '@assayer/shared/contracts';
import type { CompiledFileView, RelPath } from '@assayer/shared/contracts';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { cacheLoadBlobBroker } from '../../cache/load-blob/cache-load-blob-broker';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const compiledFileResolveBroker = async ({
  repoPath,
  relPath,
}: {
  repoPath: RepoPath;
  relPath: RelPath;
}): Promise<CompiledFileView> => {
  const manifest = await cacheLoadManifestBroker({ repoPath });
  const { files } = currentNamespaceTransformer({ manifest });
  const entry = files.find((file) => file.relPath === relPath);

  if (entry === undefined) {
    throw new Error(`Compiled file not found in the current namespace: ${relPath}`);
  }

  const blob = await cacheLoadBlobBroker({ repoPath, contentHash: entry.contentHash });

  return compiledFileViewContract.parse({ relPath, lines: blob.lines, nodes: blob.nodes });
};
