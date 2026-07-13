import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { nodeFsCacheManifestExistsAdapterProxy } from '../../../adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';

export const compiledTreeResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  rejects: (params: { error: Error }) => void;
  setupMissingManifest: () => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = nodeFsCacheManifestExistsAdapterProxy();

  return {
    setupManifest: ({ manifest }): void => {
      existsProxy.exists();
      manifestProxy.resolves({ manifest });
    },
    rejects: ({ error }): void => {
      existsProxy.exists();
      manifestProxy.rejects({ error });
    },
    setupMissingManifest: (): void => {
      existsProxy.missing();
    },
  };
};
