/**
 * PURPOSE: Reads and parses the per-namespace DERIVED stub index JSON from a repo's
 *   `.assayer/cache/stubs/<namespace>.json` using node:fs/promises. Returns undefined when the file
 *   is absent (a cache written before the stub stitch ran, or a namespace with no stubbable types),
 *   so a caller treats "no stub index" as "no stubs" rather than an ENOENT. Confined to the
 *   `.assayer/cache` tree (never source or git) — the twin of the resolved-index reader.
 *
 * USAGE:
 * const raw = await nodeFsReadStubIndexAdapter({ repoPath: RepoPathStub({ value: '/repo' }), namespace });
 * // Returns the parsed JSON contents (unknown), or undefined when the file does not exist.
 */
import { access, readFile } from 'node:fs/promises';
import type { NamespaceName } from '@assayer/shared/contracts';

import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const nodeFsReadStubIndexAdapter = async ({
  repoPath,
  namespace,
}: {
  repoPath: RepoPath;
  namespace: NamespaceName;
}): Promise<unknown> => {
  const path = `${repoPath}/.assayer/cache/stubs/${String(namespace)}.json`;

  try {
    await access(path);
  } catch (_error: unknown) {
    return undefined;
  }

  const raw = await readFile(path, 'utf8');

  return JSON.parse(raw);
};
