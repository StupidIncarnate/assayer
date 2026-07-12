/**
 * PURPOSE: Loads and validates the Assayer cache manifest for a target repo — reads the raw
 *   JSON via the node-fs adapter and parses it through the shared cache manifest contract.
 *
 * USAGE:
 * const manifest = await cacheLoadManifestBroker({ repoPath: RepoPathStub({ value: '/repo' }) });
 * // Returns the validated AssayerCacheManifest; propagates fs/JSON/validation errors unmodified.
 */
import { assayerCacheManifestContract } from '@assayer/shared/contracts';
import type { AssayerCacheManifest } from '@assayer/shared/contracts';

import { nodeFsReadCacheManifestAdapter } from '../../../adapters/node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const cacheLoadManifestBroker = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<AssayerCacheManifest> => {
  const raw = await nodeFsReadCacheManifestAdapter({ repoPath });

  return assayerCacheManifestContract.parse(raw);
};
