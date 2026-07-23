/**
 * PURPOSE: Resolves a single compiled file's view (source lines + map nodes + the cross-file imports
 *   THIS file makes) from the cache, for the current (commitless) namespace of a target repo. The
 *   resolved edges come from the namespace's resolved index filtered to `from === relPath`, so the
 *   detail panel can render each import's canonical target (a sibling file, an npm package, or a node
 *   builtin) and any declared external signature.
 *
 *   The served analysis is the persisted blob's analysis with the cross-file predicate overlay
 *   applied at serve time: a caller's opaque `if (helper(x))` guard over an IMPORTED predicate is
 *   composed against the sibling on disk, so the Tests tab shows the composed cases and any
 *   unreachable-exit lint instead of the opaque per-file blob. The overlay is a same-reference no-op
 *   for a file with no such guard, and a file whose source cannot be read falls back to the opaque
 *   analysis rather than failing the panel.
 *
 * USAGE:
 * const view = await compiledFileResolveBroker({
 *   repoPath: RepoPathStub({ value: '/repo' }),
 *   relPath: RelPathStub({ value: 'src/index.ts' }),
 * });
 * // Returns a validated CompiledFileView; throws if relPath is not in the current namespace.
 */
import { compiledFileViewContract } from '@assayer/shared/contracts';
import type { CompiledFileView, RelPath } from '@assayer/shared/contracts';
import { composeCrossFilePredicatesBroker, stubRealizeBroker, stubOverlayLoadBroker } from '@assayer/core/brokers';
import { tsMorphWalkFileAdapter } from '@assayer/core/adapters';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { cacheLoadBlobBroker } from '../../cache/load-blob/cache-load-blob-broker';
import { cacheLoadResolvedIndexBroker } from '../../cache/load-resolved-index/cache-load-resolved-index-broker';
import { repoSourceRootBroker } from '../../repo/source-root/repo-source-root-broker';
import { nodeFsReadSourceAdapter } from '../../../adapters/node-fs/read-source/node-fs-read-source-adapter';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const compiledFileResolveBroker = async ({
  repoPath,
  relPath,
}: {
  repoPath: RepoPath;
  relPath: RelPath;
}): Promise<CompiledFileView> => {
  const manifest = await cacheLoadManifestBroker({ repoPath });
  const { namespaceName, files } = currentNamespaceTransformer({ manifest });
  const entry = files.find((file) => file.relPath === relPath);

  if (entry === undefined) {
    throw new Error(`Compiled file not found in the current namespace: ${relPath}`);
  }

  const blob = await cacheLoadBlobBroker({ repoPath, contentHash: entry.contentHash });
  const resolvedIndex = await cacheLoadResolvedIndexBroker({ repoPath, namespace: namespaceName });
  const resolvedEdges =
    resolvedIndex === undefined ? [] : resolvedIndex.edges.filter((edge) => edge.from === relPath);

  // Overlay the consume-time passes on the persisted (child-independent) analysis, at serve time,
  // against the caller source on disk under the SOURCE root (not the config dir). A missing source, or a
  // blob that carries no analysis, serves the opaque analysis untouched — both overlays are same-
  // reference no-ops for a file they do not touch.
  const root = blob.analysis === undefined ? undefined : await repoSourceRootBroker({ repoPath });
  const source =
    root === undefined ? undefined : await nodeFsReadSourceAdapter({ absPath: `${String(root)}/${String(relPath)}` });
  const walked =
    source === undefined ? undefined : tsMorphWalkFileAdapter({ source: String(source), relPath: String(relPath) });
  const composed =
    blob.analysis === undefined || root === undefined || walked === undefined
      ? blob.analysis
      : composeCrossFilePredicatesBroker({ analysis: blob.analysis, walked, root: String(root), relPath: String(relPath) });
  // The object-arrange overlay on top: an object-member branch (`if (config.mode === 'a')`) is DRIVEN
  // from the merged stub view — the derived per-property demands combined with the committed
  // `assayer/stubs/` overlay under the SAME source root, read fresh per serve and never persisted.
  const analysis =
    composed === undefined || root === undefined || walked === undefined
      ? composed
      : stubRealizeBroker({
          analysis: composed,
          walked,
          root: String(root),
          relPath: String(relPath),
          overlays: await stubOverlayLoadBroker({ repoRoot: String(root) }),
        });

  return compiledFileViewContract.parse({
    relPath,
    contentHash: blob.contentHash,
    displayLines: blob.displayLines,
    nodes: blob.nodes,
    ...(analysis === undefined ? {} : { analysis }),
    resolvedEdges,
  });
};
