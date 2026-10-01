import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const runLoadBrokerProxy = (): {
  savedRun: ({ run }: { run: unknown }) => void;
  noSuchRun: () => void;
  readThrows: ({ error }: { error: Error }) => void;
} => {
  pathExistsProxy();
  readFileProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.calledWith([]).resolves(true);
  readHandle.calledWith([]).resolves(JSON.stringify(RunResultStub()));

  return {
    savedRun: ({ run }: { run: unknown }): void => {
      existsHandle.calledWith([]).resolves(true);
      readHandle.calledWith([]).resolves(JSON.stringify(run));
    },
    noSuchRun: (): void => {
      existsHandle.calledWith([]).resolves(false);
    },
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and the
    // like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => {
      existsHandle.calledWith([]).resolves(true);
      readHandle.onceFor([]).rejects(error);
    },
  };
};
