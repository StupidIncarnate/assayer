import type { StubIndexStub } from '@assayer/shared/contracts/stub-index/stub-index.stub';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';

export const cacheLoadStubIndexBrokerProxy = (): {
  resolves: (params: {
    repoPath: string;
    namespace: string;
    index: ReturnType<typeof StubIndexStub>;
  }) => void;
  absent: (params: { repoPath: string; namespace: string }) => void;
} => {
  const readJsonIfExistsGateway = readJsonFileIfExistsProxy();

  return {
    resolves: ({ repoPath, namespace, index }): void => {
      readJsonIfExistsGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/stubs/${namespace}.json`,
        rawContents: JSON.stringify(index),
      });
    },
    absent: ({ repoPath, namespace }): void => {
      readJsonIfExistsGateway.missing({
        path: `${repoPath}/.assayer/cache/stubs/${namespace}.json`,
      });
    },
  };
};
