import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const cacheLoadManifestBrokerProxy = (): {
  resolves: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = readJsonFileProxy();

  return {
    resolves: ({ manifest }): void => {
      adapterProxy.returns({ content: JSON.stringify(manifest) });
    },
    rejects: ({ error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
