/**
 * PURPOSE: Plans, resolves, and processes the stable-branch namespace of a compile run --
 *   composing compilePlanStableBroker and processTargetsLayerBroker and assembling the
 *   namespace's result-summary entry, manifest namespace, and compile errors in one place.
 *
 * USAGE:
 * await stableNamespaceLayerBroker({
 *   root: '/repo', branch: 'master', currentMax: 5, blobsDir: '/repo/.assayer/cache/blobs',
 * });
 * // Returns { resultEntry, manifestNamespace, errors } for the 'master' namespace
 */
import { stableNamespaceLayerResultContract } from '../../../contracts/stable-namespace-layer-result/stable-namespace-layer-result-contract';
import type { StableNamespaceLayerResult } from '../../../contracts/stable-namespace-layer-result/stable-namespace-layer-result-contract';
import type { AssayerCacheManifest } from '@assayer/shared/contracts';

import { compilePlanStableBroker } from '../plan-stable/compile-plan-stable-broker';
import { gitResolveCommitBroker } from '../../git/resolve-commit/git-resolve-commit-broker';
import { processTargetsLayerBroker } from './process-targets-layer-broker';
import { compileProgressEventContract } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { CompileProgressEvent } from '../../../contracts/compile-progress-event/compile-progress-event-contract';

export const stableNamespaceLayerBroker = async ({
  root,
  branch,
  exclude,
  previousManifest,
  currentMax,
  blobsDir,
  onProgress,
}: {
  root: string;
  branch: string;
  exclude?: readonly string[];
  previousManifest?: AssayerCacheManifest;
  currentMax: number;
  blobsDir: string;
  onProgress?: (event: CompileProgressEvent) => void;
}): Promise<StableNamespaceLayerResult> => {
  const previousStableCommit = previousManifest?.namespaces[branch]?.commit;

  const plan = await compilePlanStableBroker({
    repoRoot: root,
    ref: branch,
    ...(previousStableCommit === undefined ? {} : { previousCommit: String(previousStableCommit) }),
    ...(exclude === undefined ? {} : { exclude }),
  });

  const commit = await gitResolveCommitBroker({ repoRoot: root, ref: branch });
  const max = plan.mode === 'skipped' ? 0 : plan.targets.length;

  onProgress?.(
    compileProgressEventContract.parse({ namespace: branch, branch, phase: 'planned', current: 0, max, stableMax: max, currentMax }),
  );

  // The ref's files are analysed under the working tree's tsconfigs, found by path: reading the ref's own
  // configs would need a git-backed parse host that applies include and exclude itself.
  const processed = await processTargetsLayerBroker({
    remaining: plan.targets,
    root,
    namespace: branch,
    branch,
    blobsDir,
    max,
    stableMax: max,
    currentMax,
    current: 0,
    index: [],
    errors: [],
    ...(onProgress === undefined ? {} : { onProgress }),
  });

  onProgress?.(
    compileProgressEventContract.parse({ namespace: branch, branch, phase: 'done', current: max, max, stableMax: max, currentMax }),
  );

  const files = plan.mode === 'skipped' ? (previousManifest?.namespaces[branch]?.files ?? []) : processed.index;

  return stableNamespaceLayerResultContract.parse({
    resultEntry: {
      namespace: branch,
      branch,
      mode: plan.mode,
      fileCount: max,
    },
    manifestNamespace: {
      branch,
      ...(commit === undefined ? {} : { commit }),
      files,
    },
    // A SKIPPED ref planned nothing, so it has no harness bytes to stitch; its harness index already
    // sits on disk from the compile that made it, exactly as its resolved and stub indexes do.
    harnesses: plan.harnesses,
    errors: processed.errors.map((error) => ({ namespace: branch, ...error })),
  });
};
