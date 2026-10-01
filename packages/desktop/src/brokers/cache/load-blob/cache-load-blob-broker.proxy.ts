import type { CompiledFileBlobStub } from '@assayer/shared/contracts';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const cacheLoadBlobBrokerProxy = (): {
  resolves: (params: {
    repoPath: string;
    contentHash: string;
    blob: ReturnType<typeof CompiledFileBlobStub>;
  }) => void;
  missing: (params: { repoPath: string; contentHash: string }) => void;
} => {
  const readJsonGateway = readJsonFileProxy();

  return {
    resolves: ({ repoPath, contentHash, blob }): void => {
      readJsonGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/blobs/${contentHash}.json`,
        rawContents: JSON.stringify(blob),
      });
    },
    missing: ({ repoPath, contentHash }): void => {
      readJsonGateway.missing({ path: `${repoPath}/.assayer/cache/blobs/${contentHash}.json` });
    },
  };
};
