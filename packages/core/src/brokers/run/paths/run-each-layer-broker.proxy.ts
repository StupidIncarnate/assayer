import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub, fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runUnitBroker } from '../unit/run-unit-broker';
import { runUnitBrokerProxy } from '../unit/run-unit-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const runEachLayerBrokerProxy = (): {
  setupSource: ({ source }: { source: string }) => void;
  runCount: () => FileCount;
  readThrows: ({ error }: { error: Error }) => void;
} => {
  // Bare-called to satisfy enforce-proxy-child-creation. runUnitBroker is REPLACED wholesale below
  // rather than driven through its own proxy: both it and this broker read through
  // fsReadFileAdapter, so one shared read mock cannot serve a source file and a run.json at once —
  // the source would come back where JSON was expected.
  runIdBrokerProxy();
  runUnitBrokerProxy();
  readFileProxy();

  const runHandle = registerMock({ fn: runUnitBroker });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  runHandle.calledWith([]).resolves(RunResultStub());
  readHandle.calledWith([]).resolves('');

  return {
    setupSource: ({ source }: { source: string }): void => {
      readHandle.calledWith([]).resolves(source);
    },
    runCount: (): FileCount => fileCountContract.parse(runHandle.callsMatching([]).length),
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and the
    // like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => {
      readHandle.onceFor([]).rejects(error);
    },
  };
};
