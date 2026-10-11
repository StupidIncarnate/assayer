/**
 * PURPOSE: Resolves a single compiled file's view (source lines + map nodes + the cross-file imports
 *   THIS file makes) from the cache, for the current (commitless) namespace of a target repo. The
 *   resolved edges come from the namespace's resolved index filtered to `from === relPath`, so the
 *   detail panel can render each import's canonical target (a sibling file, an npm package, or a node
 *   builtin) and any declared external signature.
 *
 *   The served analysis is `compiledAnalysisResolveBroker`'s result: the persisted blob's analysis with
 *   the consume-time overlays applied at serve time, so the Tests tab shows the real cases and any
 *   unreachable-exit lint instead of the opaque per-file blob.
 *
 * USAGE:
 * const view = await compiledFileResolveBroker({
 *   repoPath: '/repo',
 *   relPath: 'src/index.ts',
 * });
 * // Returns a validated CompiledFileView; throws if relPath is not in the current namespace.
 */
import { compiledFileViewContract } from '@assayer/shared/contracts';
import type { CompiledFileView } from '@assayer/shared/contracts';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { cacheLoadBlobBroker } from '../../cache/load-blob/cache-load-blob-broker';
import { cacheLoadResolvedIndexBroker } from '../../cache/load-resolved-index/cache-load-resolved-index-broker';
import { compiledAnalysisResolveBroker } from '../../compiled-analysis/resolve/compiled-analysis-resolve-broker';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';

export const compiledFileResolveBroker = async ({
  repoPath,
  relPath,
}: {
  repoPath: string;
  relPath: string;
}): Promise<CompiledFileView> => {
  const manifest = await cacheLoadManifestBroker({ repoPath });
  const { namespaceName, files } = currentNamespaceTransformer({ manifest });
  const entry = files.find((file) => file.relPath === relPath);

  if (entry === undefined) {
    throw new Error(`Compiled file not found in the current namespace: ${relPath}`);
  }

  const blob = await cacheLoadBlobBroker({ repoPath, analysisHash: entry.analysisHash });
  const resolvedIndex = await cacheLoadResolvedIndexBroker({ repoPath, namespace: namespaceName });
  const resolvedEdges =
    resolvedIndex === undefined ? [] : resolvedIndex.edges.filter((edge) => edge.from === relPath);

  const analysis = await compiledAnalysisResolveBroker({ repoPath, relPath, blob });

  return compiledFileViewContract.parse({
    relPath,
    contentHash: blob.contentHash,
    displayLines: blob.displayLines,
    nodes: blob.nodes,
    ...(analysis === undefined ? {} : { analysis }),
    resolvedEdges,
  });
};
