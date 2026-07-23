import type { StubIndexStub } from '@assayer/shared/contracts';

import { nodeFsReadStubIndexAdapterProxy } from '../../../adapters/node-fs/read-stub-index/node-fs-read-stub-index-adapter.proxy';

export const cacheLoadStubIndexBrokerProxy = (): {
  resolves: (params: { index: ReturnType<typeof StubIndexStub> }) => void;
  absent: () => void;
} => {
  const adapterProxy = nodeFsReadStubIndexAdapterProxy();

  return {
    resolves: ({ index }): void => {
      adapterProxy.returns({ content: JSON.stringify(index) });
    },
    absent: (): void => {
      adapterProxy.absent();
    },
  };
};
