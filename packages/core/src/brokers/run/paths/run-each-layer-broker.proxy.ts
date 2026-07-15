import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub, fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runUnitBroker } from '../unit/run-unit-broker';
import { runUnitBrokerProxy } from '../unit/run-unit-broker.proxy';

export const runEachLayerBrokerProxy = (): {
  setupSource: ({ source }: { source: string }) => void;
  runCount: () => FileCount;
} => {
  // Bare-called to satisfy enforce-proxy-child-creation. runUnitBroker is REPLACED wholesale below
  // rather than driven through its own proxy: both it and this broker read through
  // fsReadFileAdapter, so one shared read mock cannot serve a source file and a run.json at once —
  // the source would come back where JSON was expected.
  runIdBrokerProxy();
  runUnitBrokerProxy();
  fsReadFileAdapterProxy();

  const runHandle = registerMock({ fn: runUnitBroker });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  runHandle.mockResolvedValue(RunResultStub());
  readHandle.mockResolvedValue('');

  return {
    setupSource: ({ source }: { source: string }): void => {
      readHandle.mockResolvedValue(source);
    },
    runCount: (): FileCount => fileCountContract.parse(runHandle.mock.calls.length),
  };
};
