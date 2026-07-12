import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import type { AssayerCacheManifestStub, CompiledFileBlobStub } from '@assayer/shared/contracts';

export const compiledFileResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  setupBlob: (params: { blob: ReturnType<typeof CompiledFileBlobStub> }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();

  return {
    setupManifest: ({ manifest }): void => {
      manifestProxy.resolves({ manifest });
    },
    setupBlob: ({ blob }): void => {
      blobProxy.resolves({ blob });
    },
  };
};
