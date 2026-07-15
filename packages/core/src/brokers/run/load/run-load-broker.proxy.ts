import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const runLoadBrokerProxy = (): {
  savedRun: ({ run }: { run: unknown }) => void;
  noSuchRun: () => void;
} => {
  fsExistsAdapterProxy();
  fsReadFileAdapterProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.mockResolvedValue(true);
  readHandle.mockResolvedValue(JSON.stringify(RunResultStub()));

  return {
    savedRun: ({ run }: { run: unknown }): void => {
      existsHandle.mockResolvedValue(true);
      readHandle.mockResolvedValue(JSON.stringify(run));
    },
    noSuchRun: (): void => {
      existsHandle.mockResolvedValue(false);
    },
  };
};
