import type { CompiledFileBlobStub } from '@assayer/shared/contracts';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const cacheLoadBlobBrokerProxy = (): {
  resolves: (params: { blob: ReturnType<typeof CompiledFileBlobStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = readJsonFileProxy();

  return {
    resolves: ({ blob }): void => {
      adapterProxy.returns({ content: JSON.stringify(blob) });
    },
    rejects: ({ error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
