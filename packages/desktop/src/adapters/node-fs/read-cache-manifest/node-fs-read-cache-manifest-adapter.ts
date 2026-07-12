/**
 * PURPOSE: Reads and parses the Assayer cache manifest JSON file from a repo's
 *   `.assayer/cache/manifest.json` using node:fs/promises.
 *
 * USAGE:
 * const manifest = await nodeFsReadCacheManifestAdapter({ repoPath: RepoPathStub({ value: '/repo' }) });
 * // Returns the parsed JSON contents (unknown); underlying fs/JSON errors propagate unmodified.
 */
import { readFile } from 'node:fs/promises';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const nodeFsReadCacheManifestAdapter = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<unknown> => {
  const path = `${repoPath}/.assayer/cache/manifest.json`;
  const raw = await readFile(path, 'utf8');

  return JSON.parse(raw);
};
