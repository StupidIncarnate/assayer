import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runLoadBroker } from '../load/run-load-broker';
import { runLoadBrokerProxy } from '../load/run-load-broker.proxy';

export const runFindBrokerProxy = (): {
  savedRun: ({ run }: { run: unknown }) => void;
  neverRun: () => void;
  fileMissing: () => void;
} => {
  // runLoadBroker is REPLACED wholesale rather than driven through its own proxy: it and this broker
  // both read through fsExistsAdapter/fsReadFileAdapter, so one shared mock cannot serve a source
  // file and a run.json at once.
  fsExistsAdapterProxy();
  fsReadFileAdapterProxy();
  runIdBrokerProxy();
  runLoadBrokerProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const loadHandle = registerMock({ fn: runLoadBroker });

  existsHandle.mockResolvedValue(true);
  loadHandle.mockResolvedValue(RunResultStub());

  return {
    savedRun: ({ run }: { run: unknown }): void => {
      existsHandle.mockResolvedValue(true);
      loadHandle.mockResolvedValue(run);
    },
    neverRun: (): void => {
      existsHandle.mockResolvedValue(true);
      loadHandle.mockResolvedValue(undefined);
    },
    fileMissing: (): void => {
      existsHandle.mockResolvedValue(false);
    },
  };
};
