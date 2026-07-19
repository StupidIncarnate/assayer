/**
 * PURPOSE: Reads and parses the per-namespace resolved index JSON from a repo's
 *   `.assayer/cache/resolved/<namespace>.json` using node:fs/promises. Returns undefined when the
 *   file is absent (a cache written before cross-file resolution, or a namespace that imports
 *   nothing resolvable), so a caller treats "no resolved index" as "no edges" rather than an ENOENT.
 *   Confined to the `.assayer/cache` tree (never source or git).
 *
 * USAGE:
 * const raw = await nodeFsReadResolvedIndexAdapter({ repoPath: RepoPathStub({ value: '/repo' }), namespace });
 * // Returns the parsed JSON contents (unknown), or undefined when the file does not exist.
 */
import { access, readFile } from 'node:fs/promises';
import type { NamespaceName } from '@assayer/shared/contracts';

import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const nodeFsReadResolvedIndexAdapter = async ({
  repoPath,
  namespace,
}: {
  repoPath: RepoPath;
  namespace: NamespaceName;
}): Promise<unknown> => {
  const path = `${repoPath}/.assayer/cache/resolved/${String(namespace)}.json`;

  try {
    await access(path);
  } catch (_error: unknown) {
    return undefined;
  }

  const raw = await readFile(path, 'utf8');

  return JSON.parse(raw);
};
