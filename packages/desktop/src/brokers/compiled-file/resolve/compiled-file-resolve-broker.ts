/**
 * PURPOSE: Resolves a single compiled file's view (source lines + map nodes + the cross-file imports
 *   THIS file makes) from the cache, for the current (commitless) namespace of a target repo. The
 *   resolved edges come from the namespace's resolved index filtered to `from === relPath`, so the
 *   detail panel can render each import's canonical target (a sibling file, an npm package, or a node
 *   builtin) and any declared external signature.
 *
 *   The served analysis is the persisted blob's analysis with the consume-time overlays applied at
 *   serve time, against the sibling files on disk: a parameter declared as an IMPORTED type is given the
 *   shape its declaration says, and a caller's opaque `if (helper(x))` guard over an IMPORTED predicate
 *   is composed — so the Tests tab shows the real cases and any unreachable-exit lint instead of the
 *   opaque per-file blob. Each overlay is a same-reference no-op for a file it does not touch, and a
 *   file whose source cannot be read falls back to the opaque analysis rather than failing the panel.
 *
 * USAGE:
 * const view = await compiledFileResolveBroker({
 *   repoPath: RepoPathStub({ value: '/repo' }),
 *   relPath: RelPathStub({ value: 'src/index.ts' }),
 * });
 * // Returns a validated CompiledFileView; throws if relPath is not in the current namespace.
 */
import { compiledFileViewContract } from '@assayer/shared/contracts';
import type { CompiledFileView } from '@assayer/shared/contracts';
import { composeCrossFilePredicatesBroker, composeCrossFileMapBroker, harnessRealizeBroker, paramTypeResolveBroker, stubRealizeBroker, stubOverlayLoadBroker } from '@assayer/core/brokers';
import { walkFileTransformer } from '@assayer/core/transformers';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { cacheLoadBlobBroker } from '../../cache/load-blob/cache-load-blob-broker';
import { cacheLoadResolvedIndexBroker } from '../../cache/load-resolved-index/cache-load-resolved-index-broker';
import { repoSourceRootBroker } from '../../repo/source-root/repo-source-root-broker';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import { readFileIfExists } from '#gateway/node/fs__promises';

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
    root === undefined ? null : await readFileIfExists(`${root}/${relPath}`);
  const walked =
    source === null ? undefined : walkFileTransformer({ source, relPath });
  // The types first: a parameter declared as an IMPORTED type is `any` in the hermetic walk, so the
  // per-file blob refuses it and invoices an input Assayer can build. Resolving the declaration against
  // the sibling on disk is what lets every overlay below read real parameter types.
  const typed =
    blob.analysis === undefined || root === undefined || walked === undefined
      ? blob.analysis
      : paramTypeResolveBroker({ analysis: blob.analysis, walked, root, relPath });
  const composed =
    typed === undefined || root === undefined || walked === undefined
      ? typed
      : composeCrossFilePredicatesBroker({ analysis: typed, walked, root, relPath });
  // The object-arrange overlay on top: an object-member branch (`if (config.mode === 'a')`) is DRIVEN
  // from the merged stub view — the derived per-property demands combined with the committed
  // `assayer/stubs/` overlay under the SAME source root, read fresh per serve and never persisted.
  const realized =
    composed === undefined || root === undefined || walked === undefined
      ? composed
      : stubRealizeBroker({
          analysis: composed,
          walked,
          root,
          relPath,
          overlays: await stubOverlayLoadBroker({ repoRoot: root }),
        });
  // The cross-file-map fold next: a surface mapping an IMPORTED function over an array param folds that
  // sibling callee's branches into the surface's cases, so the Tests tab shows the folded funnel. A
  // same-reference no-op for a file with no such map.
  const mapped =
    realized === undefined || root === undefined || walked === undefined
      ? realized
      : composeCrossFileMapBroker({ analysis: realized, walked, root, relPath });
  // The harness overlay last: an entry whose input Assayer refused is DRIVEN from the colocated
  // `<basename>.harness.ts` under the SAME source root, so the Tests tab shows the supplied cases and the
  // Admissions tab stops naming a debt the reader has already paid. Read fresh per serve, never persisted.
  // `walked` is threaded (omitted, never `undefined`, under exactOptionalPropertyTypes) so a refusal
  // owned by a funnelled or through-caller private — invoiced against its host — can be paid here too,
  // exactly as the flat own-params payment already is; a missing `walked` (unreadable source) still runs
  // the broker, which degrades to that same flat payment on its own.
  const analysis =
    mapped === undefined || root === undefined
      ? mapped
      : harnessRealizeBroker({
          analysis: mapped,
          root,
          relPath,
          ...(walked === undefined ? {} : { walked }),
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
