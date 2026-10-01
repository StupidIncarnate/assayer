import type { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

export const cacheLoadBlobBrokerProxy = (): {
  resolves: (params: {
    repoPath: string;
    analysisHash: string;
    blob: ReturnType<typeof CompiledFileBlobStub>;
  }) => void;
  missing: (params: { repoPath: string; analysisHash: string }) => void;
} => {
  const readJsonGateway = readJsonFileProxy();

  return {
    resolves: ({ repoPath, analysisHash, blob }): void => {
      readJsonGateway.returnsRaw({
        path: `${repoPath}/.assayer/cache/blobs/${analysisHash}.json`,
        rawContents: JSON.stringify(blob),
      });
    },
    missing: ({ repoPath, analysisHash }): void => {
      readJsonGateway.missing({ path: `${repoPath}/.assayer/cache/blobs/${analysisHash}.json` });
    },
  };
};
