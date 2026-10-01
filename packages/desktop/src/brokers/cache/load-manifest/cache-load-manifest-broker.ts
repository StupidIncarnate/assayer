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

import { readJsonFile } from '#gateway/node/fs__promises';

export const cacheLoadManifestBroker = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<AssayerCacheManifest> => {
  const raw = await readJsonFile(`${repoPath}/.assayer/cache/manifest.json`);

  return assayerCacheManifestContract.parse(raw);
};
