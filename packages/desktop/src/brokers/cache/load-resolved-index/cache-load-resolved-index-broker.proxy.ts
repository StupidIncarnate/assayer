import type { ResolvedIndexStub } from '@assayer/shared/contracts/resolved-index/resolved-index.stub';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';

export const cacheLoadResolvedIndexBrokerProxy = (): {
  resolves: (params: {
    repoPath: string;
    namespace: string;
    index: ReturnType<typeof ResolvedIndexStub>;
  }) => void;
  absent: (params: { repoPath: string; namespace: string }) => void;
} => {
  const readJsonIfExistsGateway = readJsonFileIfExistsProxy();

  return {
    resolves: ({ repoPath, namespace, index }): void => {
      readJsonIfExistsGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/resolved/${namespace}.json`,
        rawContents: JSON.stringify(index),
      });
    },
    absent: ({ repoPath, namespace }): void => {
      readJsonIfExistsGateway.missing({
        path: `${repoPath}/.assayer/cache/resolved/${namespace}.json`,
      });
    },
  };
};
