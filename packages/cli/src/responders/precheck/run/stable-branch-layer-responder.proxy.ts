import { gitDetectStableBranchBrokerProxy, configStableBranchSaveBrokerProxy } from '@assayer/core/testing';

import { stableBranchPickBrokerProxy } from '../../../brokers/stable-branch/pick/stable-branch-pick-broker.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';

export const StableBranchLayerResponderProxy = (): {
  notGitRepo: () => void;
  insideWith: (params: { branchListStdout: string }) => void;
  insideNoMainMaster: () => void;
  answersPicker: (params: { input: string }) => void;
  saveSucceeds: (params: { configPath: string }) => void;
  getSavedConfigsFor: (params: { configPath: string }) => unknown[];
  enableTty: () => void;
  disableTty: () => void;
  promptWritten: () => boolean;
} => {
  const detectProxy = gitDetectStableBranchBrokerProxy();
  const saveProxy = configStableBranchSaveBrokerProxy();
  const pickerProxy = stableBranchPickBrokerProxy();
  // Stdout starts as a non-terminal; an interactive test opts in through enableTty().
  const ttyProxy = stdoutProxy();
  ttyProxy.setupIsTty({ value: false });

  return {
    notGitRepo: (): void => {
      detectProxy.notGitRepo();
    },
    insideWith: ({ branchListStdout }: { branchListStdout: string }): void => {
      detectProxy.insideWith({ branchListStdout });
    },
    insideNoMainMaster: (): void => {
      detectProxy.insideNoMainMaster();
    },
    // The line a human types at the picker prompt.
    answersPicker: ({ input }: { input: string }): void => {
      pickerProxy.answersWith({ input });
    },
    saveSucceeds: ({ configPath }: { configPath: string }): void => {
      saveProxy.succeeds({ path: configPath });
    },
    // Every config body written to the path, in call order.
    getSavedConfigsFor: ({ configPath }: { configPath: string }): unknown[] =>
      saveProxy.getWrittenContentsFor({ path: configPath }),
    enableTty: (): void => {
      ttyProxy.setupIsTty({ value: true });
    },
    disableTty: (): void => {
      ttyProxy.setupIsTty({ value: false });
    },
    promptWritten: (): boolean => pickerProxy.promptWasWritten(),
  };
};
