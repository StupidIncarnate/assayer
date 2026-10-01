import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const compiledTreeResolveBrokerProxy = (): {
  setupManifest: (params: {
    repoPath: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  setupManifestVanishes: (params: { repoPath: string }) => void;
  setupMissingManifest: (params: { repoPath: string }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = pathExistsProxy();

  return {
    setupManifest: ({ repoPath, manifest }): void => {
      existsProxy.present({ path: `${repoPath}/.assayer/cache/manifest.json` });
      manifestProxy.resolves({ repoPath, manifest });
    },
    setupManifestVanishes: ({ repoPath }): void => {
      existsProxy.present({ path: `${repoPath}/.assayer/cache/manifest.json` });
      manifestProxy.missing({ repoPath });
    },
    setupMissingManifest: ({ repoPath }): void => {
      existsProxy.missing({ path: `${repoPath}/.assayer/cache/manifest.json` });
    },
  };
};
