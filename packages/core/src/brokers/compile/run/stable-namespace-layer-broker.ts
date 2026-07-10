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
import { namespaceNameContract, branchNameContract, fileCountContract } from '@assayer/shared/contracts';
import type {
  AssayerCacheManifest,
  NamespaceName,
  BranchName,
  CompileMode,
  FileCount,
  RelPath,
  ContentHash,
  LineNumber,
} from '@assayer/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

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
  resultEntry: { namespace: NamespaceName; branch: BranchName; mode: CompileMode; fileCount: FileCount };
  manifestNamespace: { branch: BranchName; commit?: ErrorMessage; files: { relPath: RelPath; contentHash: ContentHash }[] };
  errors: { namespace: NamespaceName; relPath: RelPath; line: LineNumber; column: SourcePosition['column']; message: ErrorMessage }[];
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
      namespace: namespaceNameContract.parse(branch),
      branch: branchNameContract.parse(branch),
      mode: plan.mode,
      fileCount: fileCountContract.parse(max),
    },
    manifestNamespace: {
      branch: branchNameContract.parse(branch),
      ...(commit === undefined ? {} : { commit }),
      files,
    },
    errors: processed.errors.map((error) => ({ namespace: namespaceNameContract.parse(branch), ...error })),
  };
};
