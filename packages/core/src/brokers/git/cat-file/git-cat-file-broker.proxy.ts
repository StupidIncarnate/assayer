import { catFileBlobProxy } from '#gateway/bin/git/cat-file-blob/cat-file-blob.proxy';

export const gitCatFileBrokerProxy = (): {
  hasBlob: (params: { blobSha: string; content: string }) => void;
  blobMissing: (params: { blobSha: string }) => void;
  gitNotInstalled: (params: { blobSha: string }) => void;
} => {
  const blobProxy = catFileBlobProxy();

  return {
    hasBlob: ({ blobSha, content }: { blobSha: string; content: string }): void => {
      blobProxy.setupBlob({ sha: blobSha, contents: content });
    },
    blobMissing: ({ blobSha }: { blobSha: string }): void => {
      blobProxy.setupFailure({
        sha: blobSha,
        exitCode: 128,
        output: `fatal: Not a valid object name ${blobSha}`,
      });
    },
    gitNotInstalled: ({ blobSha }: { blobSha: string }): void => {
      blobProxy.setupNotFound({ sha: blobSha });
    },
  };
};
