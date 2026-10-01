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
import type { AssayerCacheManifest, CompileMode, ContentHash } from '@assayer/shared/contracts';

import { compilePlanStableBroker } from '../plan-stable/compile-plan-stable-broker';
import { gitResolveCommitBroker } from '../../git/resolve-commit/git-resolve-commit-broker';
import { processTargetsLayerBroker } from './process-targets-layer-broker';
import { compileProgressEventContract } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { CompileProgressEvent } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { SourcePosition } from '../../../contracts/source-position/source-position-contract';

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
}): Promise<{
  resultEntry: { namespace: string; branch: string; mode: CompileMode; fileCount: number };
  manifestNamespace: { branch: string; commit?: string; files: { relPath: string; contentHash: ContentHash }[] };
  harnesses: { relPath: string; content: string }[];
  errors: { namespace: string; relPath: string; line: number; column: SourcePosition['column']; message: string }[];
}> => {
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

  const processed = await processTargetsLayerBroker({
    remaining: plan.targets,
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

  return {
    resultEntry: {
      namespace: branch,
      branch: branch,
      mode: plan.mode,
      fileCount: max,
    },
    manifestNamespace: {
      branch: branch,
      ...(commit === undefined ? {} : { commit }),
      files,
    },
    // A SKIPPED ref planned nothing, so it has no harness bytes to stitch; its harness index already
    // sits on disk from the compile that made it, exactly as its resolved and stub indexes do.
    harnesses: plan.harnesses,
    errors: processed.errors.map((error) => ({ namespace: branch, ...error })),
  };
};
