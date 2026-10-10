import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const compiledTreeResolveBrokerProxy = (): {
  setupManifest: (params: {
    repoPath: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  setupManifestVanishes: (params: { repoPath: string }) => void;
  setupMissingManifest: (params: { repoPath: string }) => void;
  setupBlob: (params: {
    repoPath: string;
    analysisHash: string;
    blob: unknown;
  }) => void;
  missingBlob: (params: { repoPath: string; analysisHash: string }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = pathExistsProxy();
  const readJsonGateway = readJsonFileProxy();

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
    setupBlob: ({ repoPath, analysisHash, blob }): void => {
      readJsonGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/blobs/${analysisHash}.json`,
        rawContents: JSON.stringify(blob),
      });
    },
    missingBlob: ({ repoPath, analysisHash }): void => {
      readJsonGateway.missing({ path: `${repoPath}/.assayer/cache/blobs/${analysisHash}.json` });
    },
  };
};
