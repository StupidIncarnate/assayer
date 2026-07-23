/**
 * PURPOSE: Loads and validates the DERIVED stub index for one namespace of a target repo — reads the
 *   raw JSON via the node-fs adapter and parses it through the shared stub-index contract. Returns
 *   undefined when no stub index has been written for the namespace (a pre-stitch cache, or a
 *   namespace with no stubbable types), so a caller treats it as "no stubs" rather than an error.
 *   The twin of the resolved-index loader.
 *
 * USAGE:
 * const index = await cacheLoadStubIndexBroker({ repoPath, namespace });
 * // Returns the validated StubIndex, or undefined when the namespace has no stub index.
 */
import { stubIndexContract } from '@assayer/shared/contracts';
import type { NamespaceName, StubIndex } from '@assayer/shared/contracts';

import { nodeFsReadStubIndexAdapter } from '../../../adapters/node-fs/read-stub-index/node-fs-read-stub-index-adapter';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const cacheLoadStubIndexBroker = async ({
  repoPath,
  namespace,
}: {
  repoPath: RepoPath;
  namespace: NamespaceName;
}): Promise<StubIndex | undefined> => {
  const raw = await nodeFsReadStubIndexAdapter({ repoPath, namespace });

  if (raw === undefined) {
    return undefined;
  }

  return stubIndexContract.parse(raw);
};
