/**
 * PURPOSE: Contract for the Assayer cache manifest — the top-level record of what the
 *   content-hash cache holds per namespace (branch/commit + the file hashes derived from it),
 *   scoped to the tool identity and config hash that produced it. `assayerVersion` is NOT a
 *   semver — it is a CONTENT HASH of the analyzer's own source (see analyzerHashBroker), so any
 *   change to the analysis code invalidates the whole cache with no manual version bump.
 *
 * USAGE:
 * const manifest = assayerCacheManifestContract.parse({
 *   assayerVersion: '1.0.0',
 *   configHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   namespaces: {},
 *   repoName: 'assayer',
 *   rootFolderName: 'smoke-repo',
 * });
 * // Returns a validated AssayerCacheManifest (branded fields)
 */
import { z } from 'zod';

import { relPathContract } from '../rel-path/rel-path-contract';
import { contentHashContract } from '../content-hash/content-hash-contract';
import { branchNameContract } from '../branch-name/branch-name-contract';
import { repoNameContract } from '../repo-name/repo-name-contract';
import { folderNameContract } from '../folder-name/folder-name-contract';

export const assayerCacheManifestContract = z.object({
  assayerVersion: z.string().min(1).brand<'AssayerVersion'>(),
  configHash: z
    .string()
    .regex(/^[0-9a-f]{64}$/u)
    .brand<'ConfigHash'>(),
  namespaces: z
    .record(
      z.string(),
      z.object({
        branch: branchNameContract.optional(),
        commit: z.string().min(1).brand<'CommitSha'>().optional(),
        files: z.array(z.object({ relPath: relPathContract, contentHash: contentHashContract })),
      }),
    )
    .brand<'NamespaceMap'>(),
  repoName: repoNameContract,
  rootFolderName: folderNameContract,
});

export type AssayerCacheManifest = z.infer<typeof assayerCacheManifestContract>;
