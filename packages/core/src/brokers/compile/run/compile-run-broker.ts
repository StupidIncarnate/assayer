/**
 * PURPOSE: Runs one compile pass across the current working-tree namespace and the optional
 *   stable-branch namespace -- planning each, processing every target through the content-hash
 *   cache in order (stable first, then current), streaming progress, and writing the resulting
 *   cache manifest only when every target parses cleanly.
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

import { pathBasenameAdapter } from '../../../adapters/path/basename/path-basename-adapter';

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

  const currentMode = previousManifest === undefined ? 'net-new' : 'incremental';

  const results = [
    ...(stable === undefined ? [] : [stable.resultEntry]),
    { namespace: currentBranch, branch: currentBranch, mode: currentMode, fileCount: currentMax },
  ];

  const currentErrors = currentProcessed.errors.map((error) => ({
    namespace: namespaceNameContract.parse(String(currentBranch)),
    ...error,
  }));

  const errors = [...(stable === undefined ? [] : stable.errors), ...currentErrors];

  if (errors.length > 0) {
    return compileResultContract.parse({ status: 'errors', results, errors });
  }

  const namespaces = {
    [String(currentBranch)]: { branch: currentBranch, files: currentProcessed.index },
    ...(stable === undefined ? {} : { [String(stable.manifestNamespace.branch)]: stable.manifestNamespace }),
  };

  const manifest = {
    assayerVersion,
    configHash,
    namespaces,
    repoName: String(repoName),
    rootFolderName: String(rootFolderName),
  };

  await manifestWriteBroker({ configDir, manifest: assayerCacheManifestContract.parse(manifest) });

  return compileResultContract.parse({ status: 'ok', results, errors: [] });
};
