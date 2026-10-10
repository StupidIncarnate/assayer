/**
 * PURPOSE: Resolves the compiled file tree for the current namespace out of the on-disk cache
 *   manifest — loads the manifest, finds the current (commitless) namespace, reads cached blob
 *   analyses to tally per-file error counts, and builds the nested tree plus TS/TSX file-count
 *   summary consumed by the compiled-surface explorer. When no cache manifest exists yet (dev /
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
import { z } from '#gateway/npm/zod';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import { treeNodesTransformer } from '../../../transformers/tree-nodes/tree-nodes-transformer';
import { emptyCompiledTreeStatics } from '../../../statics/empty-compiled-tree/empty-compiled-tree-statics';
import { pathExists, readJsonFile } from '#gateway/node/fs__promises';

const blobAnalysisShapeContract = z.object({
  analysis: z.object({
    undriven: z.array(z.unknown()).optional(),
    lints: z.array(z.unknown()).optional(),
    darkSpots: z.array(z.unknown()).optional(),
    gaps: z.array(z.unknown()).optional(),
  }).optional(),
}).loose();

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
        const raw = await readJsonFile(`${repoPath}/.assayer/cache/blobs/${file.analysisHash}.json`);
        const parsed = blobAnalysisShapeContract.safeParse(raw);
        if (parsed.success && parsed.data.analysis !== undefined) {
          const count =
            (parsed.data.analysis.undriven?.length ?? 0) +
            (parsed.data.analysis.lints?.length ?? 0) +
            (parsed.data.analysis.darkSpots?.length ?? 0) +
            (parsed.data.analysis.gaps?.length ?? 0);
          if (count > 0) {
            errorCountsByPath.set(file.relPath, count);
          }
        }
      } catch {
        // Blob missing or unreadable; skip gracefully as 0 errors
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
