import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub, fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runUnitBroker } from '../unit/run-unit-broker';
import { runUnitBrokerProxy } from '../unit/run-unit-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// Each scenario names the source file it stages and its colocated harness path, because the run id
// looks for the harness after the file is read. A file no scenario staged reaches an unstaged call,
// which throws.
export const runEachLayerBrokerProxy = (): {
  setupSource: ({
    sourcePath,
    harnessPath,
    source,
  }: {
    sourcePath: string;
    harnessPath: string;
    source: string;
  }) => void;
  runCount: () => FileCount;
  readDenied: ({ sourcePath }: { sourcePath: string }) => void;
} => {
  // runUnitBroker is REPLACED wholesale below rather than driven through its own proxy: the run it
  // answers with is a staged result, so no run.json has to be written and read back at a staged path.
  runUnitBrokerProxy();
  const idProxy = runIdBrokerProxy();
  const fileProxy = readFileProxy();

  const runHandle = registerMock({ fn: runUnitBroker });

  runHandle.calledWith([]).resolves(RunResultStub());

  return {
    setupSource: ({
      sourcePath,
      harnessPath,
      source,
    }: {
      sourcePath: string;
      harnessPath: string;
      source: string;
    }): void => {
      fileProxy.returns({ path: sourcePath, contents: source });
      idProxy.noHarness({ harnessPath });
    },
    runCount: (): FileCount => fileCountContract.parse(runHandle.callsMatching([]).length),
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and the
    // like) propagates to the caller unmodified. This stages that rejection.
    readDenied: ({ sourcePath }: { sourcePath: string }): void => {
      fileProxy.denied({ path: sourcePath });
    },
  };
};
