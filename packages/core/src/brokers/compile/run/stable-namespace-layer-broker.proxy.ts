import { compilePlanStableBrokerProxy } from '../plan-stable/compile-plan-stable-broker.proxy';
import { gitResolveCommitBrokerProxy } from '../../git/resolve-commit/git-resolve-commit-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';

export const stableNamespaceLayerBrokerProxy = (): {
  unchanged: (params: { ref: string; sha: string }) => void;
  changed: (params: {
    ref: string;
    sha: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
    root: string;
    blobsDir: string;
  }) => void;
  changedCommitUnresolvable: (params: {
    ref: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
    root: string;
    blobsDir: string;
  }) => void;
  processedCount: () => number;
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
      root,
      blobsDir,
    }: {
      ref: string;
      sha: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
      root: string;
      blobsDir: string;
    }): void => {
      planStableProxy.resolvesChanged({ ref, sha, lsTreeStdout, blobs });
      resolveCommitProxy.resolvesTo({ ref, sha });
      // Each blob's path is the `ls-tree` line that names its sha, after the tab.
      blobs.forEach(({ blobSha, content }) => {
        const line = lsTreeStdout.split('\n').find((entry) => entry.includes(blobSha)) ?? '';
        processTargetsProxy.queueCleanWrite({ blobsDir, absPath: `${root}/${line.slice(line.indexOf('\t') + 1)}`, content });
      });
    },
    changedCommitUnresolvable: ({
      ref,
      lsTreeStdout,
      blobs,
      root,
      blobsDir,
    }: {
      ref: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
      root: string;
      blobsDir: string;
    }): void => {
      planStableProxy.resolvesChangedCommitUnresolvable({ ref, lsTreeStdout, blobs });
      resolveCommitProxy.refMissing({ ref });
      // Each blob's path is the `ls-tree` line that names its sha, after the tab.
      blobs.forEach(({ blobSha, content }) => {
        const line = lsTreeStdout.split('\n').find((entry) => entry.includes(blobSha)) ?? '';
        processTargetsProxy.queueCleanWrite({ blobsDir, absPath: `${root}/${line.slice(line.indexOf('\t') + 1)}`, content });
      });
    },
    processedCount: (): number => processTargetsProxy.processedCount(),
  };
};
