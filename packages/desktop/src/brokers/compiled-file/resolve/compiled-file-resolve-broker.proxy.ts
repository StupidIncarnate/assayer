import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import { cacheLoadResolvedIndexBrokerProxy } from '../../cache/load-resolved-index/cache-load-resolved-index-broker.proxy';
import type { AssayerCacheManifestStub, CompiledFileBlobStub, ResolvedIndexStub } from '@assayer/shared/contracts';

export const compiledFileResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  setupBlob: (params: { blob: ReturnType<typeof CompiledFileBlobStub> }) => void;
  setupResolvedIndex: (params: { index: ReturnType<typeof ResolvedIndexStub> }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();
  // Base behaviour is "no resolved index for the namespace", so a view carries no edges unless a
  // test wires one via setupResolvedIndex.
  const resolvedIndexProxy = cacheLoadResolvedIndexBrokerProxy();

  return {
    setupManifest: ({ manifest }): void => {
      manifestProxy.resolves({ manifest });
    },
    setupBlob: ({ blob }): void => {
      blobProxy.resolves({ blob });
    },
    setupResolvedIndex: ({ index }): void => {
      resolvedIndexProxy.resolves({ index });
    },
  };
};
