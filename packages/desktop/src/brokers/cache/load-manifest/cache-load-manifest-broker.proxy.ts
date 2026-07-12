import { nodeFsReadCacheManifestAdapterProxy } from '../../../adapters/node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';

export const cacheLoadManifestBrokerProxy = (): {
  resolves: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = nodeFsReadCacheManifestAdapterProxy();

  return {
    resolves: ({ manifest }): void => {
      adapterProxy.returns({ content: JSON.stringify(manifest) });
    },
    rejects: ({ error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
