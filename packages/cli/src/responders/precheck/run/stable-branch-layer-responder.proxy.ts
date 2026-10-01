import { gitDetectStableBranchBrokerProxy } from '@assayer/core/brokers/git/detect-stable-branch/git-detect-stable-branch-broker.proxy';
import { configStableBranchSaveBrokerProxy } from '@assayer/core/brokers/config/stable-branch-save/config-stable-branch-save-broker.proxy';

import { stableBranchPickBrokerProxy } from '../../../brokers/stable-branch/pick/stable-branch-pick-broker.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';

export const StableBranchLayerResponderProxy = (): {
  notGitRepo: () => void;
  insideWith: (params: { branchListStdout: string }) => void;
  insideNoMainMaster: () => void;
  answersPicker: (params: { prompt: string; input: string }) => void;
  saveSucceeds: (params: { configPath: string }) => void;
  getSavedConfigsFor: (params: { configPath: string }) => unknown[];
  enableTty: () => void;
  disableTty: () => void;
  promptsAsked: () => readonly string[];
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
    // The line a human types at the picker prompt, addressed by the exact prompt text.
    answersPicker: ({ prompt, input }: { prompt: string; input: string }): void => {
      pickerProxy.answersWith({ prompt, input });
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
    promptsAsked: (): readonly string[] => pickerProxy.getPromptsAsked(),
  };
};
