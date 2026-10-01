import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub } from '@assayer/shared/contracts';

import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runLoadBroker } from '../load/run-load-broker';
import { runLoadBrokerProxy } from '../load/run-load-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// Every scenario names the source file's path and its colocated harness path, because the broker
// checks and reads the source and then derives the run id, which looks for the harness. A path no
// scenario staged throws.
export const runFindBrokerProxy = (): {
  savedRun: ({
    sourcePath,
    harnessPath,
    source,
    run,
  }: {
    sourcePath: string;
    harnessPath: string;
    source: string;
    run: unknown;
  }) => void;
  neverRun: ({
    sourcePath,
    harnessPath,
    source,
  }: {
    sourcePath: string;
    harnessPath: string;
    source: string;
  }) => void;
  fileMissing: ({ sourcePath }: { sourcePath: string }) => void;
  readDenied: ({ sourcePath }: { sourcePath: string }) => void;
} => {
  // runLoadBroker is REPLACED wholesale rather than driven through its own proxy, so each scenario
  // picks the run the lookup answers with instead of writing a run.json on a staged path.
  const existsProxy = pathExistsProxy();
  const fileProxy = readFileProxy();
  const idProxy = runIdBrokerProxy();
  runLoadBrokerProxy();

  const loadHandle = registerMock({ fn: runLoadBroker });

  loadHandle.calledWith([]).resolves(RunResultStub());

  return {
    savedRun: ({ sourcePath, harnessPath, source, run }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      idProxy.noHarness({ harnessPath });
      loadHandle.calledWith([]).resolves(run);
    },
    neverRun: ({ sourcePath, harnessPath, source }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      idProxy.noHarness({ harnessPath });
      loadHandle.calledWith([]).resolves(undefined);
    },
    fileMissing: ({ sourcePath }: { sourcePath: string }): void => {
      existsProxy.missing({ path: sourcePath });
    },
    // The source read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES
    // and the like) propagates to the caller unmodified. This stages that rejection.
    readDenied: ({ sourcePath }: { sourcePath: string }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.denied({ path: sourcePath });
    },
  };
};
