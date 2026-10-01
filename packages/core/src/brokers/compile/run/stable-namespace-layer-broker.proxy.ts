import { compilePlanStableBrokerProxy } from '../plan-stable/compile-plan-stable-broker.proxy';
import { gitResolveCommitBrokerProxy } from '../../git/resolve-commit/git-resolve-commit-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';
import type { FileCount } from '@assayer/shared/contracts';

export const stableNamespaceLayerBrokerProxy = (): {
  unchanged: (params: { ref: string; sha: string }) => void;
  changed: (params: {
    ref: string;
    sha: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
    blobsDir: string;
  }) => void;
  changedCommitUnresolvable: (params: {
    ref: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
    blobsDir: string;
  }) => void;
  processedCount: () => FileCount;
} => {
  const planStableProxy = compilePlanStableBrokerProxy();
  const resolveCommitProxy = gitResolveCommitBrokerProxy();
  const processTargetsProxy = processTargetsLayerBrokerProxy();

  return {
    unchanged: ({ ref, sha }: { ref: string; sha: string }): void => {
      planStableProxy.resolvesUnchanged({ ref, sha });
      resolveCommitProxy.resolvesTo({ ref, sha });
    },
    changed: ({
      ref,
      sha,
      lsTreeStdout,
      blobs,
      blobsDir,
    }: {
      ref: string;
      sha: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
      blobsDir: string;
    }): void => {
      planStableProxy.resolvesChanged({ ref, sha, lsTreeStdout, blobs });
      resolveCommitProxy.resolvesTo({ ref, sha });
      blobs.forEach(({ content }) => {
        processTargetsProxy.queueCleanWrite({ blobsDir, content });
      });
    },
    changedCommitUnresolvable: ({
      ref,
      lsTreeStdout,
      blobs,
      blobsDir,
    }: {
      ref: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
      blobsDir: string;
    }): void => {
      planStableProxy.resolvesChangedCommitUnresolvable({ ref, lsTreeStdout, blobs });
      resolveCommitProxy.refMissing({ ref });
      blobs.forEach(({ content }) => {
        processTargetsProxy.queueCleanWrite({ blobsDir, content });
      });
    },
    processedCount: (): FileCount => processTargetsProxy.processedCount(),
  };
};
