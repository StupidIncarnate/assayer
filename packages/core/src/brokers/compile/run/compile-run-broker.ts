/**
 * PURPOSE: Runs one compile pass across the current working-tree namespace and the optional
 *   stable-branch namespace -- planning each, processing every target through the content-hash
 *   cache in order (stable first, then current), stitching each processed namespace's cross-file
 *   imports to their definitions, streaming progress, and writing the resulting cache manifest and
 *   per-namespace resolved indexes only when every target parses AND every import resolves. When
 *   currentBranch === stableBranch
 *   (working ON the stable trunk) the two manifest namespaces collide on one key; CURRENT WINS --
 *   the working-tree index (irrecoverable uncommitted edits) overwrites the committed stable index
 *   (a pure function of ref + blob store, recomputable on demand).
 *
 * USAGE:
 * await compileRunBroker({
 *   configDir: '/repo',
 *   config: AssayerConfigStub(),
 *   assayerVersion: '1.0.0',
 *   configHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 * });
 * // Returns { status: 'ok', results: [...], errors: [] } and writes the cache manifest, or
 * // { status: 'errors', results: [...], errors: [...] } and leaves the prior manifest untouched
 */
import { compileResultContract, assayerCacheManifestContract, namespaceNameContract } from '@assayer/shared/contracts';
import type { CompileResult, AssayerCacheManifest, AssayerConfig } from '@assayer/shared/contracts';

import { compileProgressEventContract } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { CompileProgressEvent } from '../../../contracts/compile-progress-event/compile-progress-event-contract';

import { compileResolveRootBroker } from '../resolve-root/compile-resolve-root-broker';
import { compilePlanCurrentBroker } from '../plan-current/compile-plan-current-broker';

import { gitCurrentBranchBroker } from '../../git/current-branch/git-current-branch-broker';

import { manifestWriteBroker } from '../../manifest/write/manifest-write-broker';
import { resolvedIndexWriteBroker } from '../../resolved-index/write/resolved-index-write-broker';

import { pathBasenameAdapter } from '../../../adapters/path/basename/path-basename-adapter';

import { compileResolveGraphBroker } from '../resolve-graph/compile-resolve-graph-broker';
import { compileStubGraphBroker } from '../stub-graph/compile-stub-graph-broker';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { stubOverlayReconcileBroker } from '../../stub-overlay/reconcile/stub-overlay-reconcile-broker';
import { stubContradictionsTransformer } from '../../../transformers/stub-contradictions/stub-contradictions-transformer';
import { processTargetsLayerBroker } from './process-targets-layer-broker';
import { stableNamespaceLayerBroker } from './stable-namespace-layer-broker';

export const compileRunBroker = async ({
  configDir,
  config,
  previousManifest,
  assayerVersion,
  configHash,
  onProgress,
}: {
  configDir: string;
  config: AssayerConfig;
  previousManifest?: AssayerCacheManifest;
  assayerVersion: string;
  configHash: string;
  onProgress?: (event: CompileProgressEvent) => void;
}): Promise<CompileResult> => {
  const root = compileResolveRootBroker({ repoRoot: config.repoRoot, configDir });
  const rootFolderName = pathBasenameAdapter({ path: String(root) });
  const repoName = pathBasenameAdapter({ path: configDir });
  const blobsDir = `${configDir}/.assayer/cache/blobs`;

  const currentBranch = await gitCurrentBranchBroker({ repoRoot: String(root) });
  const currentPlan = await compilePlanCurrentBroker({ root: String(root), exclude: config.exclude });
  const currentMax = currentPlan.targets.length;

  const {stableBranch} = config;

  const stable =
    stableBranch === undefined
      ? undefined
      : await stableNamespaceLayerBroker({
          root: String(root),
          branch: String(stableBranch),
          exclude: config.exclude,
          currentMax,
          blobsDir,
          ...(previousManifest === undefined ? {} : { previousManifest }),
          ...(onProgress === undefined ? {} : { onProgress }),
        });

  const stableMax = stable === undefined ? 0 : stable.resultEntry.fileCount;

  onProgress?.(
    compileProgressEventContract.parse({
      namespace: currentBranch,
      branch: currentBranch,
      phase: 'planned',
      current: 0,
      max: currentMax,
      stableMax,
      currentMax,
    }),
  );

  const currentProcessed = await processTargetsLayerBroker({
    remaining: currentPlan.targets,
    namespace: String(currentBranch),
    branch: String(currentBranch),
    blobsDir,
    max: currentMax,
    stableMax,
    currentMax,
    current: 0,
    index: [],
    errors: [],
    ...(onProgress === undefined ? {} : { onProgress }),
  });

  onProgress?.(
    compileProgressEventContract.parse({
      namespace: currentBranch,
      branch: currentBranch,
      phase: 'done',
      current: currentMax,
      max: currentMax,
      stableMax,
      currentMax,
    }),
  );

  // The stitch: resolve every reference/edge in each processed namespace to its canonical definition.
  // Its unresolvable/dynamic-import failures are build errors of the same class as a parse failure —
  // mapped with the owning namespace and folded into `errors`, so the gate below flips the status and
  // the responder prints `relPath:line:column message` with no responder change. The current namespace
  // is always resolved; the stable namespace is resolved only when it was (re)processed this run — a
  // SKIPPED stable is unchanged, so its resolved index already sits on disk from the compile that made
  // it.
  const resolved = await compileResolveGraphBroker({
    root: String(root),
    blobsDir,
    cacheDir: `${configDir}/.assayer/cache`,
    files: currentProcessed.index,
  });

  const resolvedStable =
    stable === undefined || stable.resultEntry.mode === 'skipped'
      ? undefined
      : await compileResolveGraphBroker({
          root: String(root),
          blobsDir,
          cacheDir: `${configDir}/.assayer/cache`,
          files: stable.manifestNamespace.files,
        });

  const currentMode = previousManifest === undefined ? 'net-new' : 'incremental';

  const results = [
    ...(stable === undefined ? [] : [stable.resultEntry]),
    { namespace: currentBranch, branch: currentBranch, mode: currentMode, fileCount: currentMax },
  ];

  const currentErrors = currentProcessed.errors.map((error) => ({
    namespace: namespaceNameContract.parse(String(currentBranch)),
    ...error,
  }));

  const resolveErrors = resolved.errors.map((error) => ({
    namespace: namespaceNameContract.parse(String(currentBranch)),
    ...error,
  }));

  const stableResolveErrors =
    stable === undefined || resolvedStable === undefined
      ? []
      : resolvedStable.errors.map((error) => ({ namespace: stable.resultEntry.namespace, ...error }));

  const errors = [
    ...(stable === undefined ? [] : stable.errors),
    ...stableResolveErrors,
    ...currentErrors,
    ...resolveErrors,
  ];

  if (errors.length > 0) {
    return compileResultContract.parse({ status: 'errors', results, errors });
  }

  // Spread STABLE first, then write CURRENT last: when currentBranch === stableBranch the keys
  // collide and the last write wins, so the working-tree index (with its irrecoverable uncommitted
  // edits) overwrites the committed stable index -- which is recomputable on demand from its ref.
  // For distinct branches order is irrelevant (both coexist; manifestWriteBroker sorts keys).
  const namespaces = {
    ...(stable === undefined ? {} : { [String(stable.manifestNamespace.branch)]: stable.manifestNamespace }),
    [String(currentBranch)]: { branch: currentBranch, files: currentProcessed.index },
  };

  const manifest = {
    assayerVersion,
    configHash,
    namespaces,
    repoName: String(repoName),
    rootFolderName: String(rootFolderName),
  };

  await manifestWriteBroker({ configDir, manifest: assayerCacheManifestContract.parse(manifest) });

  // Write STABLE first, then CURRENT: on a currentBranch === stableBranch collision the two resolved
  // indexes share one namespace file and the last write wins, so the working-tree resolution overwrites
  // the committed-ref one — mirroring the manifest namespace collision above.
  if (stable !== undefined && resolvedStable !== undefined) {
    await resolvedIndexWriteBroker({ configDir, namespace: String(stable.resultEntry.namespace), index: resolvedStable.index });
  }

  await resolvedIndexWriteBroker({ configDir, namespace: String(currentBranch), index: resolved.index });

  // The stub stitch: derive each namespace's stub index (object types' per-property value demands
  // spliced onto their full property lists) from the SAME finished blobs, keyed on the SAME layout +
  // tsconfig hash the resolved index carries — never re-resolved. It rides the same error gate above
  // and the same collision rule: write STABLE first, CURRENT last, so a currentBranch === stableBranch
  // collision keeps the working-tree stubs. A SKIPPED stable is unchanged, so its stub index already
  // sits on disk from the compile that made it.
  if (stable !== undefined && resolvedStable !== undefined) {
    await compileStubGraphBroker({
      configDir,
      namespace: String(stable.resultEntry.namespace),
      blobsDir,
      resolvedIndex: resolvedStable.index,
      files: stable.manifestNamespace.files,
    });
  }

  const currentStub = await compileStubGraphBroker({
    configDir,
    namespace: String(currentBranch),
    blobsDir,
    resolvedIndex: resolved.index,
    files: currentProcessed.index,
  });

  // The committed overlay (`assayer/stubs/`) reconciles against the DERIVED stub index it does NOT
  // belong to on the SAME errors[] channel as a broken import (exit 1). Two ways an overlay is wrong,
  // reported together: a correction naming a type/property that no longer exists is STALE (reconcile),
  // and a correction whose authoritative values cannot satisfy a branch guard that reads the property
  // is a CONTRADICTION — dead code under the human's truth, caught BEFORE running (stub-contradictions,
  // over the guards the stub stitch gathered from the same blobs). The overlay is in no hash, so the
  // derived cache written above stays valid — only the run fails, so the human rectifies the overlay
  // and reruns against an unchanged, already-warm cache.
  const overlay = await stubOverlayLoadBroker({ repoRoot: String(root) });
  const overlayErrors = [
    ...stubOverlayReconcileBroker({ index: currentStub.index, overlays: overlay }),
    ...stubContradictionsTransformer({ guards: currentStub.guards, overlays: overlay }),
  ].map((error) => ({
    namespace: namespaceNameContract.parse(String(currentBranch)),
    ...error,
  }));

  if (overlayErrors.length > 0) {
    return compileResultContract.parse({ status: 'errors', results, errors: overlayErrors });
  }

  return compileResultContract.parse({ status: 'ok', results, errors: [] });
};
