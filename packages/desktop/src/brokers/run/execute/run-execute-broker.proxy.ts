import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runFindBroker } from '@assayer/core/brokers';
import { runFindBrokerProxy } from '@assayer/core/testing';
import { RunResultStub } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { assayerCliEntryPathAdapter } from '../../../adapters/assayer-cli/entry-path/assayer-cli-entry-path-adapter';
import { assayerCliEntryPathAdapterProxy } from '../../../adapters/assayer-cli/entry-path/assayer-cli-entry-path-adapter.proxy';
import { nodeChildProcessExecAdapterProxy } from '../../../adapters/node-child-process/exec/node-child-process-exec-adapter.proxy';
import { ExecutablePathStub } from '../../../contracts/executable-path/executable-path.stub';

export const runExecuteBrokerProxy = (): {
  savedRun: ({ run }: { run: RunResult }) => void;
  noArtifact: ({ stderr }: { stderr: string }) => void;
  cliNotBuilt: () => void;
  runSucceeds: () => void;
  getSpawnArgs: () => readonly unknown[] | undefined;
} => {
  // Bare-called for enforce-proxy-child-creation; the cross-package chain cannot intercept core's
  // I/O from here, so the direct registerMock is what drives it.
  runFindBrokerProxy();
  assayerCliEntryPathAdapterProxy();

  const exec = nodeChildProcessExecAdapterProxy();
  const findHandle = registerMock({ fn: runFindBroker });
  const entryHandle = registerMock({ fn: assayerCliEntryPathAdapter });

  entryHandle.mockReturnValue(ExecutablePathStub({ value: '/repo/packages/cli/dist/bin/assayer.js' }));
  findHandle.mockResolvedValue(RunResultStub());

  return {
    savedRun: ({ run }: { run: RunResult }): void => {
      findHandle.mockResolvedValue(run);
    },
    noArtifact: ({ stderr }: { stderr: string }): void => {
      findHandle.mockResolvedValue(undefined);
      exec.exitsWith({ exitCode: 1, stdout: '', stderr });
    },
    cliNotBuilt: (): void => {
      entryHandle.mockReturnValue(undefined);
    },
    runSucceeds: (): void => {
      exec.exitsWith({ exitCode: 0, stdout: 'src/a.ts  1/1 passed', stderr: '' });
    },
    getSpawnArgs: (): readonly unknown[] | undefined => exec.getLastCall(),
  };
};
