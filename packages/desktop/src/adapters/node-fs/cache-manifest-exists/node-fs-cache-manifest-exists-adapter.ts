/**
 * PURPOSE: Reports whether a repo's Assayer cache manifest (`.assayer/cache/manifest.json`) exists
 *   on disk, WITHOUT reading it — lets callers treat a missing cache as an empty compiled surface
 *   instead of surfacing an ENOENT. Confined to the `.assayer/cache` tree (never source or git).
 *
 * USAGE:
 * const present = await nodeFsCacheManifestExistsAdapter({ repoPath: RepoPathStub({ value: '/repo' }) });
 * // Returns true when the manifest file is accessible, false otherwise (never throws).
 */
import { access } from 'node:fs/promises';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const nodeFsCacheManifestExistsAdapter = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<boolean> => {
  const path = `${repoPath}/.assayer/cache/manifest.json`;

  try {
    await access(path);

    return true;
  } catch (_error: unknown) {
    return false;
  }
};
