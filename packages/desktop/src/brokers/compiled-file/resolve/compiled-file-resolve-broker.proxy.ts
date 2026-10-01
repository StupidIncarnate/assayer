import { composeCrossFilePredicatesBrokerProxy } from '@assayer/core/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';
import { composeCrossFileMapBrokerProxy } from '@assayer/core/brokers/compose/cross-file-map/compose-cross-file-map-broker.proxy';
import { harnessRealizeBrokerProxy } from '@assayer/core/brokers/harness/realize/harness-realize-broker.proxy';
import { paramTypeResolveBrokerProxy } from '@assayer/core/brokers/param-type/resolve/param-type-resolve-broker.proxy';
import { stubRealizeBrokerProxy } from '@assayer/core/brokers/stub/realize/stub-realize-broker.proxy';
import { stubOverlayLoadBrokerProxy } from '@assayer/core/brokers/stub-overlay/load/stub-overlay-load-broker.proxy';

import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import { cacheLoadResolvedIndexBrokerProxy } from '../../cache/load-resolved-index/cache-load-resolved-index-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
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
    contentHash: string;
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
  noTsconfigAt: (params: { root: string }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();
  const resolvedIndexProxy = cacheLoadResolvedIndexBrokerProxy();
  const sourceRootProxy = repoSourceRootBrokerProxy();
  const sourceReadProxy = readFileIfExistsProxy();

  // The overlays run for real. Each sibling file an overlay resolves and reads is staged through the
  // compose proxy, since every overlay resolves a sibling through the same seam. The stub overlay proxy
  // stages the committed-corrections folder and the harness proxy stages the colocated harness file.
  const paramTypeProxy = paramTypeResolveBrokerProxy();
  const stubRealizeProxy = stubRealizeBrokerProxy();
  const crossFileMapProxy = composeCrossFileMapBrokerProxy();
  const composeProxy = composeCrossFilePredicatesBrokerProxy();
  const overlayProxy = stubOverlayLoadBrokerProxy();
  const harnessProxy = harnessRealizeBrokerProxy();

  return {
    setupManifest: ({ repoPath, manifest }): void => {
      manifestProxy.resolves({ repoPath, manifest });
    },
    setupBlob: ({ repoPath, contentHash, blob }): void => {
      blobProxy.resolves({ repoPath, contentHash, blob });
    },
    setupResolvedIndex: ({ repoPath, namespace, index }): void => {
      resolvedIndexProxy.resolves({ repoPath, namespace, index });
    },
    setupNoResolvedIndex: ({ repoPath, namespace }): void => {
      resolvedIndexProxy.absent({ repoPath, namespace });
    },
    sourceRootRepoRoot: ({ repoPath, repoRoot }): void => {
      sourceRootProxy.configHasRepoRoot({ repoPath, repoRoot });
    },
    // The source file exists, and no committed stub corrections sit under its root.
    sourceReads: ({ root, relPath, content }): void => {
      sourceReadProxy.returns({ path: `${root}/${relPath}`, contents: content });
      overlayProxy.dirMissing({ path: `${root}/assayer/stubs/objects` });
      overlayProxy.dirMissing({ path: `${root}/assayer/stubs/env` });
    },
    sourceMissing: ({ root, relPath }): void => {
      sourceReadProxy.missing({ path: `${root}/${relPath}` });
    },
    // A sibling file the served file imports: the import specifier lands on `fileName`, whose contents
    // are `source`.
    siblingResolvesTo: ({ fileName, source, specifier }): void => {
      composeProxy.setupSibling({ fileName, source, specifier });
    },
    // The colocated harness file at `path` exists and holds `source`.
    harnessReads: ({ path, source }): void => {
      harnessProxy.setupHarness({ path, source });
    },
    // The tsconfig search every overlay runs from the source root `root` finds nothing, so the
    // compiler options are empty.
    noTsconfigAt: ({ root }): void => {
      paramTypeProxy.noTsconfigAt({ root });
      stubRealizeProxy.noTsconfigAt({ root });
      crossFileMapProxy.noTsconfigAt({ root });
      composeProxy.noTsconfigAt({ root });
    },
  };
};
