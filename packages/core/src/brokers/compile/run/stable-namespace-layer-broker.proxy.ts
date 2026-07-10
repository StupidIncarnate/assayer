import { compilePlanStableBrokerProxy } from '../plan-stable/compile-plan-stable-broker.proxy';
import { gitResolveCommitBrokerProxy } from '../../git/resolve-commit/git-resolve-commit-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';
import type { FileCount } from '@assayer/shared/contracts';

export const stableNamespaceLayerBrokerProxy = (): {
  unchanged: (params: { sha: string }) => void;
  changed: (params: { sha: string; lsTreeStdout: string; fileContents: readonly string[] }) => void;
  changedCommitUnresolvable: (params: { lsTreeStdout: string; fileContents: readonly string[] }) => void;
  processedCount: () => FileCount;
} => {
  const planStableProxy = compilePlanStableBrokerProxy();
  const resolveCommitProxy = gitResolveCommitBrokerProxy();
  const processTargetsProxy = processTargetsLayerBrokerProxy();

  return {
    unchanged: ({ sha }: { sha: string }): void => {
      planStableProxy.resolvesUnchanged({ sha });
      resolveCommitProxy.resolvesTo({ sha });
    },
    changed: ({
      sha,
      lsTreeStdout,
      fileContents,
    }: {
      sha: string;
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      planStableProxy.resolvesChanged({ sha, lsTreeStdout, fileContents });
      resolveCommitProxy.resolvesTo({ sha });
      fileContents.forEach(() => {
        processTargetsProxy.queueCleanWrite();
      });
    },
    changedCommitUnresolvable: ({
      lsTreeStdout,
      fileContents,
    }: {
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      planStableProxy.resolvesChangedCommitUnresolvable({ lsTreeStdout, fileContents });
      resolveCommitProxy.refMissing();
      fileContents.forEach(() => {
        processTargetsProxy.queueCleanWrite();
      });
    },
    processedCount: (): FileCount => processTargetsProxy.processedCount(),
  };
};
