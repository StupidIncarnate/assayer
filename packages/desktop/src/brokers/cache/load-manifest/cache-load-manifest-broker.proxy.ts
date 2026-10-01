import type { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const cacheLoadManifestBrokerProxy = (): {
  resolves: (params: {
    repoPath: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  missing: (params: { repoPath: string }) => void;
} => {
  const readJsonGateway = readJsonFileProxy();

  return {
    resolves: ({ repoPath, manifest }): void => {
      readJsonGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/manifest.json`,
        rawContents: JSON.stringify(manifest),
      });
    },
    missing: ({ repoPath }): void => {
      readJsonGateway.missing({ path: `${repoPath}/.assayer/cache/manifest.json` });
    },
  };
};
