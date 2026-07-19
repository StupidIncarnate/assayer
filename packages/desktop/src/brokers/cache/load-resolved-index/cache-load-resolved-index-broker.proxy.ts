import type { ResolvedIndexStub } from '@assayer/shared/contracts';

import { nodeFsReadResolvedIndexAdapterProxy } from '../../../adapters/node-fs/read-resolved-index/node-fs-read-resolved-index-adapter.proxy';

export const cacheLoadResolvedIndexBrokerProxy = (): {
  resolves: (params: { index: ReturnType<typeof ResolvedIndexStub> }) => void;
  absent: () => void;
} => {
  const adapterProxy = nodeFsReadResolvedIndexAdapterProxy();

  return {
    resolves: ({ index }): void => {
      adapterProxy.returns({ content: JSON.stringify(index) });
    },
    absent: (): void => {
      adapterProxy.absent();
    },
  };
};
