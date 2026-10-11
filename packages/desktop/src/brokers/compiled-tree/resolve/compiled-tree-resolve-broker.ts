/**
 * PURPOSE: Resolves the compiled file tree for the current namespace out of the on-disk cache
 *   manifest — loads the manifest, finds the current (commitless) namespace, tallies per-file error
 *   counts, and builds the nested tree plus TS/TSX file-count summary consumed by the compiled-surface
 *   explorer. A file's error count is the number of admissions its detail panel lists, so it is counted
 *   on the analysis after the consume-time overlays, never on the raw persisted blob: a harness, a stub
 *   or a resolved import can close an admission the blob still carries. When no cache manifest exists yet (dev /
 *   first run before any `assayer` compile), returns a contract-valid EMPTY tree (placeholder
 *   summary, zero counts, no nodes) so the explorer renders its empty-state terminal cleanly
 *   instead of the desktop main throwing ENOENT.
 *
 * USAGE:
 * const tree = await compiledTreeResolveBroker({ repoPath: '/repo' });
 * // Returns the validated CompiledTree (summary + nodes) for the current namespace
 */
import { compiledTreeContract } from '@assayer/shared/contracts';
import type { CompiledTree } from '@assayer/shared/contracts';
import { compiledFileBlobContract } from '@assayer/shared/contracts';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { compiledAnalysisResolveBroker } from '../../compiled-analysis/resolve/compiled-analysis-resolve-broker';
import { analysisErrorCountTransformer } from '../../../transformers/analysis-error-count/analysis-error-count-transformer';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import { treeNodesTransformer } from '../../../transformers/tree-nodes/tree-nodes-transformer';
import { emptyCompiledTreeStatics } from '../../../statics/empty-compiled-tree/empty-compiled-tree-statics';
import { pathExists, readJsonFile } from '#gateway/node/fs__promises';

export const compiledTreeResolveBroker = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<CompiledTree> => {
  const manifestExists = await pathExists(`${repoPath}/.assayer/cache/manifest.json`);

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

  const errorCountsByPath = new Map<string, number>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const blob = compiledFileBlobContract.parse(
          await readJsonFile(`${repoPath}/.assayer/cache/blobs/${file.analysisHash}.json`),
        );
        // A blob with no admission has nothing an overlay could close, so only a blob that carries one
        // pays for the overlays.
        if (blob.analysis !== undefined && analysisErrorCountTransformer({ analysis: blob.analysis }) > 0) {
          const analysis = await compiledAnalysisResolveBroker({ repoPath, relPath: file.relPath, blob });
          const count = analysis === undefined ? 0 : analysisErrorCountTransformer({ analysis });
          if (count > 0) {
            errorCountsByPath.set(file.relPath, count);
          }
        }
      } catch {
        // Blob missing or unreadable, or its overlays cannot run; the file shows no badge. Opening the
        // file surfaces the underlying error.
      }
    }),
  );

  const nodes = treeNodesTransformer({
    relPaths: files.map((file) => file.relPath),
    errorCountsByPath,
  });
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
