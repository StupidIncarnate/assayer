/**
 * PURPOSE: Resolves the "current" namespace — the dirty working tree — out of an
 *   AssayerCacheManifest. The current namespace is the sole namespace entry with NO `commit`
 *   field (stable namespaces always carry a commit SHA); every other entry is a stable ref.
 *
 * USAGE:
 * currentNamespaceTransformer({ manifest });
 * // Returns { namespaceName, files } for the one commitless namespace entry, or throws if
 * // zero or more than one entry lacks a commit
 */
import { namespaceNameContract } from '@assayer/shared/contracts';
import type { AssayerCacheManifest, NamespaceName, RelPath, ContentHash } from '@assayer/shared/contracts';

export const currentNamespaceTransformer = ({
  manifest,
}: {
  manifest: AssayerCacheManifest;
}): { namespaceName: NamespaceName; files: { relPath: RelPath; contentHash: ContentHash }[] } => {
  const entries = Object.entries(manifest.namespaces);
  const commitless = entries.filter(([, entry]) => entry.commit === undefined);
  const [found] = commitless;

  if (commitless.length !== 1 || found === undefined) {
    throw new Error(
      `Cannot resolve current namespace: expected exactly one working-tree entry without a commit among [${entries.map(([key]) => key).join(', ')}]`,
    );
  }

  const [key, entry] = found;

  return { namespaceName: namespaceNameContract.parse(key), files: entry.files };
};
