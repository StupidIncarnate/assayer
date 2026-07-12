/**
 * PURPOSE: Reads and parses a single content-addressed cache blob JSON file from a repo's
 *   `.assayer/cache/blobs/<contentHash>.json` using node:fs/promises.
 *
 * USAGE:
 * const blob = await nodeFsReadCacheBlobAdapter({
 *   repoPath: RepoPathStub({ value: '/repo' }),
 *   contentHash: 'abc123',
 * });
 * // Returns the parsed JSON contents (unknown); underlying fs/JSON errors propagate unmodified.
 */
import { readFile } from 'node:fs/promises';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const nodeFsReadCacheBlobAdapter = async ({
  repoPath,
  contentHash,
}: {
  repoPath: RepoPath;
  contentHash: string;
}): Promise<unknown> => {
  const path = `${repoPath}/.assayer/cache/blobs/${contentHash}.json`;
  const raw = await readFile(path, 'utf8');

  return JSON.parse(raw);
};
