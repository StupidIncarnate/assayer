import type { ResolvedIndexStub } from '@assayer/shared/contracts';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';


export const cacheLoadResolvedIndexBrokerProxy = (): {
  resolves: (params: { index: ReturnType<typeof ResolvedIndexStub> }) => void;
  absent: () => void;
} => {
  const adapterProxy = readJsonFileIfExistsProxy();

  return {
    resolves: ({ index }): void => {
      adapterProxy.returns({ content: JSON.stringify(index) });
    },
    absent: (): void => {
      adapterProxy.absent();
    },
  };
};
