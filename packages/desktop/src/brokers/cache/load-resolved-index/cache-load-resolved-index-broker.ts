/**
 * PURPOSE: Loads and validates the resolved index for one namespace of a target repo — reads the raw
 *   JSON via the node-fs adapter and parses it through the shared resolved-index contract. Returns
 *   undefined when no resolved index has been written for the namespace (a pre-resolution cache, or a
 *   namespace with nothing to resolve), so a caller treats it as "no resolved edges" rather than an
 *   error.
 *
 * USAGE:
 * const index = await cacheLoadResolvedIndexBroker({ repoPath, namespace });
 * // Returns the validated ResolvedIndex, or undefined when the namespace has no resolved index.
 */
import { resolvedIndexContract } from '@assayer/shared/contracts';
import type { NamespaceName, ResolvedIndex } from '@assayer/shared/contracts';

import { nodeFsReadResolvedIndexAdapter } from '../../../adapters/node-fs/read-resolved-index/node-fs-read-resolved-index-adapter';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const cacheLoadResolvedIndexBroker = async ({
  repoPath,
  namespace,
}: {
  repoPath: RepoPath;
  namespace: NamespaceName;
}): Promise<ResolvedIndex | undefined> => {
  const raw = await nodeFsReadResolvedIndexAdapter({ repoPath, namespace });

  if (raw === undefined) {
    return undefined;
  }

  return resolvedIndexContract.parse(raw);
};
