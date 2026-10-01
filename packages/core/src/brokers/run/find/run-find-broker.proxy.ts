import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runLoadBroker } from '../load/run-load-broker';
import { runLoadBrokerProxy } from '../load/run-load-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const runFindBrokerProxy = (): {
  savedRun: ({ run }: { run: unknown }) => void;
  neverRun: () => void;
  fileMissing: () => void;
  readThrows: ({ error }: { error: Error }) => void;
} => {
  // runLoadBroker is REPLACED wholesale rather than driven through its own proxy: it and this broker
  // both read through fsExistsAdapter/fsReadFileAdapter, so one shared mock cannot serve a source
  // file and a run.json at once.
  pathExistsProxy();
  readFileProxy();
  runIdBrokerProxy();
  runLoadBrokerProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  // Registered directly against the WRAPPER (mirroring existsHandle above), not via
  // fsReadFileAdapterProxy()'s own handle: runIdBrokerProxy/runLoadBrokerProxy also mock
  // fsReadFileAdapter directly, which auto-mocks it as a bare jest.fn() with no real
  // implementation -- so a rejection staged one level down, on the raw `readFile` the adapter
  // proxy controls, is never reached from this broker's own direct call.
  const readHandle = registerMock({ fn: fsReadFileAdapter });
  const loadHandle = registerMock({ fn: runLoadBroker });

  existsHandle.calledWith([]).resolves(true);
  readHandle.calledWith([]).resolves('');
  loadHandle.calledWith([]).resolves(RunResultStub());

  return {
    savedRun: ({ run }: { run: unknown }): void => {
      existsHandle.calledWith([]).resolves(true);
      loadHandle.calledWith([]).resolves(run);
    },
    neverRun: (): void => {
      existsHandle.calledWith([]).resolves(true);
      loadHandle.calledWith([]).resolves(undefined);
    },
    fileMissing: (): void => {
      existsHandle.calledWith([]).resolves(false);
    },
    // The source read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT
    // and the like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => {
      existsHandle.calledWith([]).resolves(true);
      readHandle.onceFor([]).rejects(error);
    },
  };
};
