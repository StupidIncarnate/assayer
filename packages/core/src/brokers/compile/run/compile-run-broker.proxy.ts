import type { FileCount } from '@assayer/shared/contracts';

import { compileResolveRootBrokerProxy } from '../resolve-root/compile-resolve-root-broker.proxy';
import { pathBasenameAdapterProxy } from '../../../adapters/path/basename/path-basename-adapter.proxy';
import { gitCurrentBranchBrokerProxy } from '../../git/current-branch/git-current-branch-broker.proxy';
import { compilePlanCurrentBrokerProxy } from '../plan-current/compile-plan-current-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';
import { stableNamespaceLayerBrokerProxy } from './stable-namespace-layer-broker.proxy';
import { manifestWriteBrokerProxy } from '../../manifest/write/manifest-write-broker.proxy';

export const compileRunBrokerProxy = (): {
  onCurrentBranch: (params: { name: string }) => void;
  queueCurrentFiles: (params: { contents: readonly string[] }) => void;
  stableUnchanged: (params: { sha: string }) => void;
  stableChanged: (params: { sha: string; lsTreeStdout: string; fileContents: readonly string[] }) => void;
  stableChangedCommitUnresolvable: (params: { lsTreeStdout: string; fileContents: readonly string[] }) => void;
  manifestWriteSucceeds: () => void;
  getWrittenManifest: () => unknown;
  wasManifestWritten: () => boolean;
  getProcessedFileCount: () => FileCount;
} => {
  compileResolveRootBrokerProxy();
  pathBasenameAdapterProxy();
  const currentBranchProxy = gitCurrentBranchBrokerProxy();
  const planCurrentProxy = compilePlanCurrentBrokerProxy();
  const processCurrentProxy = processTargetsLayerBrokerProxy();
  const stableProxy = stableNamespaceLayerBrokerProxy();
  const manifestProxy = manifestWriteBrokerProxy();

  return {
    onCurrentBranch: ({ name }: { name: string }): void => {
      currentBranchProxy.onBranch({ name });
    },
    queueCurrentFiles: ({ contents }: { contents: readonly string[] }): void => {
      planCurrentProxy.queueDir({
        entries: contents.map((_content, index) => ({ name: `current-${index}.ts`, isDirectory: false })),
      });
      contents.forEach((content) => {
        planCurrentProxy.queueFileContent({ content });
        processCurrentProxy.queueCleanWrite();
      });
    },
    stableUnchanged: ({ sha }: { sha: string }): void => {
      stableProxy.unchanged({ sha });
    },
    stableChanged: ({
      sha,
      lsTreeStdout,
      fileContents,
    }: {
      sha: string;
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      stableProxy.changed({ sha, lsTreeStdout, fileContents });
    },
    stableChangedCommitUnresolvable: ({
      lsTreeStdout,
      fileContents,
    }: {
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      stableProxy.changedCommitUnresolvable({ lsTreeStdout, fileContents });
    },
    manifestWriteSucceeds: (): void => {
      manifestProxy.succeeds();
    },
    getWrittenManifest: (): unknown => manifestProxy.getWrittenManifest(),
    wasManifestWritten: (): boolean => manifestProxy.wasWritten(),
    getProcessedFileCount: (): FileCount => processCurrentProxy.processedCount(),
  };
};
