/**
 * PURPOSE: Writes the assayer cache manifest to disk atomically (a temp file, then a rename),
 *   canonicalizing namespace-key and file ordering first so the same manifest content always
 *   produces byte-identical JSON -- load-bearing for the content-hash cache's determinism
 *   guarantee across cold starts and CI runs.
 *
 * USAGE:
 * await manifestWriteBroker({ configDir: '/repo', manifest });
 * // Writes '/repo/.assayer/cache/manifest.json' atomically, creating the cache directory first
 */
import type { AssayerCacheManifest } from '@assayer/shared/contracts';

import { writeFileAtomic } from '#gateway/node/fs__promises';

export const manifestWriteBroker = async ({
  configDir,
  manifest,
}: {
  configDir: string;
  manifest: AssayerCacheManifest;
}): Promise<void> => {
  const cacheDir = `${configDir}/.assayer/cache`;

  // Namespace keys are unique by JS object construction, so a two-way comparator is sufficient
  // (no equal case can ever occur) -- keeps a would-be-dead tiebreak branch out of the code.
  const sortedNamespaceEntries = Object.entries(manifest.namespaces).sort(([a], [b]) =>
    a < b ? -1 : 1,
  );

  const namespaces = Object.fromEntries(
    sortedNamespaceEntries.map(([namespaceKey, namespace]) => {
      const sortedFiles = [...namespace.files].sort((a, b) =>
        a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0,
      );

      return [
        namespaceKey,
        {
          ...(namespace.branch === undefined ? {} : { branch: namespace.branch }),
          ...(namespace.commit === undefined ? {} : { commit: namespace.commit }),
          files: sortedFiles,
        },
      ];
    }),
  );

  const canonical = {
    assayerVersion: manifest.assayerVersion,
    configHash: manifest.configHash,
    namespaces,
    repoName: manifest.repoName,
    rootFolderName: manifest.rootFolderName,
  };

  await writeFileAtomic(`${cacheDir}/manifest.json`, JSON.stringify(canonical));
};
