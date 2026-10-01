import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const compiledTreeResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  rejects: (params: { error: Error }) => void;
  setupMissingManifest: () => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = pathExistsProxy();

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
