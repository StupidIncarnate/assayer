import { nodeFsReadCacheBlobAdapterProxy } from '../../../adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.proxy';
import type { CompiledFileBlobStub } from '@assayer/shared/contracts';

export const cacheLoadBlobBrokerProxy = (): {
  resolves: (params: { blob: ReturnType<typeof CompiledFileBlobStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = nodeFsReadCacheBlobAdapterProxy();

  return {
    resolves: ({ blob }): void => {
      adapterProxy.returns({ content: JSON.stringify(blob) });
    },
    rejects: ({ error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
