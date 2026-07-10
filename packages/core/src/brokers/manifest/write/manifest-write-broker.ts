/**
 * PURPOSE: Writes the assayer cache manifest to disk atomically (tmp write + rename),
 *   canonicalizing namespace-key and file ordering first so the same manifest content always
 *   produces byte-identical JSON -- load-bearing for the content-hash cache's determinism
 *   guarantee across cold starts and CI runs.
 *
 * USAGE:
 * await manifestWriteBroker({ configDir: '/repo', manifest });
 * // Writes '/repo/.assayer/cache/manifest.json' atomically and returns { success: true }
 */
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import type { AssayerCacheManifest } from '@assayer/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const manifestWriteBroker = async ({
  configDir,
  manifest,
}: {
  configDir: string;
  manifest: AssayerCacheManifest;
}): Promise<AdapterResult> => {
  const cacheDir = `${configDir}/.assayer/cache`;
  await fsMkdirAdapter({ path: cacheDir });

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

  const content = JSON.stringify(canonical);
  const tmpPath = `${cacheDir}/manifest.json.tmp`;

  await fsWriteFileAdapter({ path: tmpPath, content });
  await fsRenameAdapter({ from: tmpPath, to: `${cacheDir}/manifest.json` });

  return { success: true as const };
};
