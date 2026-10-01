import { gitResolveCommitBrokerProxy } from '../../git/resolve-commit/git-resolve-commit-broker.proxy';
import { gitLsTreeBrokerProxy } from '../../git/ls-tree/git-ls-tree-broker.proxy';
import { gitCatFileBrokerProxy } from '../../git/cat-file/git-cat-file-broker.proxy';
import { harnessClassifyBrokerProxy } from '../../harness/classify/harness-classify-broker.proxy';

export const compilePlanStableBrokerProxy = (): {
  resolvesUnchanged: (params: { ref: string; sha: string }) => void;
  resolvesChanged: (params: {
    ref: string;
    sha: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
  }) => void;
  resolvesChangedCommitUnresolvable: (params: {
    ref: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
  }) => void;
} => {
  const resolveCommitProxy = gitResolveCommitBrokerProxy();
  const lsTreeProxy = gitLsTreeBrokerProxy();
  const catFileProxy = gitCatFileBrokerProxy();
  harnessClassifyBrokerProxy();

  return {
    resolvesUnchanged: ({ ref, sha }: { ref: string; sha: string }): void => {
      resolveCommitProxy.resolvesTo({ ref, sha });
    },
    resolvesChanged: ({
      ref,
      sha,
      lsTreeStdout,
      blobs,
    }: {
      ref: string;
      sha: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
    }): void => {
      resolveCommitProxy.resolvesTo({ ref, sha });
      lsTreeProxy.returnsTree({ ref, stdout: lsTreeStdout });
      blobs.forEach(({ blobSha, content }) => {
        catFileProxy.hasBlob({ blobSha, content });
      });
    },
    resolvesChangedCommitUnresolvable: ({
      ref,
      lsTreeStdout,
      blobs,
    }: {
      ref: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
    }): void => {
      resolveCommitProxy.refMissing({ ref });
      lsTreeProxy.returnsTree({ ref, stdout: lsTreeStdout });
      blobs.forEach(({ blobSha, content }) => {
        catFileProxy.hasBlob({ blobSha, content });
      });
    },
  };
};
