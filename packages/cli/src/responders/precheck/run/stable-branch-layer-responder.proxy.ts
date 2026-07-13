import { registerMock } from '@dungeonmaster/testing/register-mock';
import { gitDetectStableBranchBroker, configStableBranchSaveBroker } from '@assayer/core/brokers';
import { gitDetectStableBranchBrokerProxy, configStableBranchSaveBrokerProxy } from '@assayer/core/testing';
import { assayerConfigContract, branchNameContract, fileCountContract } from '@assayer/shared/contracts';
import type { FileCount, BranchNameStub } from '@assayer/shared/contracts';

import { processStdoutIsTtyAdapterProxy } from '../../../adapters/process-stdout/is-tty/process-stdout-is-tty-adapter.proxy';
import { readlineStableBranchPickAdapter } from '../../../adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter';
import { readlineStableBranchPickAdapterProxy } from '../../../adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.proxy';

type BranchName = ReturnType<typeof BranchNameStub>;

export const StableBranchLayerResponderProxy = (): {
  notGitRepo: () => void;
  insideWith: (params: { branchListStdout: string }) => void;
  insideNoMainMaster: () => void;
  picksBranch: (params: { branch: BranchName }) => void;
  pickerCallCount: () => FileCount;
  saveSucceeds: () => void;
  wasSaveCalled: () => boolean;
  getSavedConfigJson: () => unknown;
  enableTty: () => void;
  disableTty: () => void;
  promptWritten: () => boolean;
} => {
  // The @assayer/core/testing composed proxies below are instantiated to satisfy
  // enforce-proxy-child-creation, but the cross-package registerMock chain they wire up
  // cannot intercept real I/O here — the ts-jest proxy-mock AST collector only resolves
  // relative imports (see importPathResolverMiddleware in @dungeonmaster/testing), so it
  // never walks into a bare "@assayer/core/testing" specifier to find the registerMock
  // calls nested inside core's own adapter proxies. Mocking the broker/adapter functions
  // directly below (same-file imports the transformer CAN see) is what actually drives
  // this test's behavior.
  gitDetectStableBranchBrokerProxy();
  configStableBranchSaveBrokerProxy();
  // readline picker is mocked via pickerHandle below; its proxy also spies process.stdout.write,
  // so promptWritten() surfaces any prompt bytes the responder path emits (none, when gated off).
  const pickerProxy = readlineStableBranchPickAdapterProxy();
  // Same-package proxy that toggles the real process.stdout.isTTY global, so composing it genuinely
  // drives the responder's TTY gate. Default to non-TTY; interactive tests opt in via enableTty().
  const ttyProxy = processStdoutIsTtyAdapterProxy();
  ttyProxy.disableTty();

  const gitDetectHandle = registerMock({ fn: gitDetectStableBranchBroker });
  const configSaveHandle = registerMock({ fn: configStableBranchSaveBroker });
  const pickerHandle = registerMock({ fn: readlineStableBranchPickAdapter });

  const savedConfig: { json: unknown } = { json: undefined };

  configSaveHandle.mockImplementation(async ({ config }: { config: unknown }) => {
    const parsed = assayerConfigContract.parse(config);

    savedConfig.json = JSON.stringify(parsed);

    return Promise.resolve(parsed);
  });

  return {
    notGitRepo: (): void => {
      gitDetectHandle.mockResolvedValueOnce({ hasGitRepo: false });
    },
    insideWith: ({ branchListStdout }: { branchListStdout: string }): void => {
      const present = new Set(
        branchListStdout
          .split('\n')
          .map((line) => line.replace('*', '').trim())
          .filter((line) => line.length > 0),
      );
      const candidates = (['main', 'master'] as const)
        .filter((branch) => present.has(branch))
        .map((branch) => branchNameContract.parse(branch));
      const [preselected] = candidates;

      gitDetectHandle.mockResolvedValueOnce(
        preselected === undefined
          ? { hasGitRepo: true, candidates: [] }
          : { hasGitRepo: true, candidates, preselected },
      );
    },
    insideNoMainMaster: (): void => {
      gitDetectHandle.mockResolvedValueOnce({ hasGitRepo: true, candidates: [] });
    },
    picksBranch: ({ branch }: { branch: BranchName }): void => {
      pickerHandle.mockResolvedValueOnce(branch);
    },
    pickerCallCount: (): FileCount => fileCountContract.parse(pickerHandle.mock.calls.length),
    saveSucceeds: (): void => undefined,
    wasSaveCalled: (): boolean => configSaveHandle.mock.calls.length > 0,
    getSavedConfigJson: (): unknown => savedConfig.json,
    enableTty: (): void => {
      ttyProxy.enableTty();
    },
    disableTty: (): void => {
      ttyProxy.disableTty();
    },
    promptWritten: (): boolean => pickerProxy.promptWasWritten(),
  };
};
