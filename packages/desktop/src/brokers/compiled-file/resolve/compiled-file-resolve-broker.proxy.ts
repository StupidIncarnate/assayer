import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import { cacheLoadResolvedIndexBrokerProxy } from '../../cache/load-resolved-index/cache-load-resolved-index-broker.proxy';
import { compiledAnalysisResolveBrokerProxy } from '../../compiled-analysis/resolve/compiled-analysis-resolve-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import type { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import type { ResolvedIndexStub } from '@assayer/shared/contracts/resolved-index/resolved-index.stub';

export const compiledFileResolveBrokerProxy = (): {
  setupManifest: (params: {
    repoPath: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  setupBlob: (params: {
    repoPath: string;
    analysisHash: string;
    blob: ReturnType<typeof CompiledFileBlobStub>;
  }) => void;
  setupResolvedIndex: (params: {
    repoPath: string;
    namespace: string;
    index: ReturnType<typeof ResolvedIndexStub>;
  }) => void;
  setupNoResolvedIndex: (params: { repoPath: string; namespace: string }) => void;
  sourceRootRepoRoot: (params: { repoPath: string; repoRoot: string }) => void;
  sourceReads: (params: { root: string; relPath: string; content: string }) => void;
  sourceMissing: (params: { root: string; relPath: string }) => void;
  siblingResolvesTo: (params: { fileName: string; source: string; specifier: string }) => void;
  harnessReads: (params: { path: string; source: string }) => void;
  harnessMissing: (params: { path: string }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();
  const resolvedIndexProxy = cacheLoadResolvedIndexBrokerProxy();
  const analysisProxy = compiledAnalysisResolveBrokerProxy();

  return {
    setupManifest: ({ repoPath, manifest }): void => {
      manifestProxy.resolves({ repoPath, manifest });
    },
    setupBlob: ({ repoPath, analysisHash, blob }): void => {
      blobProxy.resolves({ repoPath, analysisHash, blob });
    },
    setupResolvedIndex: ({ repoPath, namespace, index }): void => {
      resolvedIndexProxy.resolves({ repoPath, namespace, index });
    },
    setupNoResolvedIndex: ({ repoPath, namespace }): void => {
      resolvedIndexProxy.absent({ repoPath, namespace });
    },
    sourceRootRepoRoot: analysisProxy.sourceRootRepoRoot,
    sourceReads: analysisProxy.sourceReads,
    sourceMissing: analysisProxy.sourceMissing,
    siblingResolvesTo: analysisProxy.siblingResolvesTo,
    harnessReads: analysisProxy.harnessReads,
    harnessMissing: analysisProxy.harnessMissing,
  };
};
