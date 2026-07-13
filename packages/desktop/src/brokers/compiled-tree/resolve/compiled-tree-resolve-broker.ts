/**
 * PURPOSE: Resolves the compiled file tree for the current namespace out of the on-disk cache
 *   manifest — loads the manifest, finds the current (commitless) namespace, and builds the
 *   nested tree plus TS/TSX file-count summary consumed by the compiled-surface explorer. When no
 *   cache manifest exists yet (dev / first run before any `assayer` compile), returns a
 *   contract-valid EMPTY tree (placeholder summary, zero counts, no nodes) so the explorer renders
 *   its empty-state terminal cleanly instead of the desktop main throwing ENOENT.
 *
 * USAGE:
 * const tree = await compiledTreeResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });
 * // Returns the validated CompiledTree (summary + nodes) for the current namespace
 */
import { compiledTreeContract } from '@assayer/shared/contracts';
import type { CompiledTree } from '@assayer/shared/contracts';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { nodeFsCacheManifestExistsAdapter } from '../../../adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import { treeNodesTransformer } from '../../../transformers/tree-nodes/tree-nodes-transformer';
import { emptyCompiledTreeStatics } from '../../../statics/empty-compiled-tree/empty-compiled-tree-statics';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const compiledTreeResolveBroker = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<CompiledTree> => {
  const manifestExists = await nodeFsCacheManifestExistsAdapter({ repoPath });

  if (!manifestExists) {
    return compiledTreeContract.parse({
      summary: {
        repoName: emptyCompiledTreeStatics.summary.repoName,
        branchName: emptyCompiledTreeStatics.summary.branchName,
        rootFolderName: emptyCompiledTreeStatics.summary.rootFolderName,
        tsCount: emptyCompiledTreeStatics.summary.tsCount,
        tsxCount: emptyCompiledTreeStatics.summary.tsxCount,
      },
      nodes: [],
    });
  }

  const manifest = await cacheLoadManifestBroker({ repoPath });
  const { namespaceName, files } = currentNamespaceTransformer({ manifest });
  const nodes = treeNodesTransformer({ relPaths: files.map((file) => file.relPath) });
  const tsCount = files.filter((file) => file.relPath.endsWith('.ts')).length;
  const tsxCount = files.filter((file) => file.relPath.endsWith('.tsx')).length;

  return compiledTreeContract.parse({
    summary: {
      repoName: manifest.repoName,
      branchName: namespaceName,
      rootFolderName: manifest.rootFolderName,
      tsCount,
      tsxCount,
    },
    nodes,
  });
};
