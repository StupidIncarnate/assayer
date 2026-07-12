import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';

export const compiledTreeResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();

  return {
    setupManifest: ({ manifest }): void => {
      manifestProxy.resolves({ manifest });
    },
    rejects: ({ error }): void => {
      manifestProxy.rejects({ error });
    },
  };
};
