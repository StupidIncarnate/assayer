import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { runLoadBrokerProxy } from '../load/run-load-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// Every scenario names the source file's path and its colocated harness path, because the broker
// checks and reads the source and then derives the run id, which looks for the harness. The run id is
// the real hash of the file's path and bytes, so a scenario names the config directory and that id, and
// the broker finds the run only when its own derivation lands on the same id. A path no scenario staged
// throws.
export const runFindBrokerProxy = (): {
  savedRun: ({
    sourcePath,
    harnessPath,
    source,
    configDir,
    runId,
    run,
  }: {
    sourcePath: string;
    harnessPath: string;
    source: string;
    configDir: string;
    runId: string;
    run: unknown;
  }) => void;
  neverRun: ({
    sourcePath,
    harnessPath,
    source,
    configDir,
    runId,
  }: {
    sourcePath: string;
    harnessPath: string;
    source: string;
    configDir: string;
    runId: string;
  }) => void;
  fileMissing: ({ sourcePath }: { sourcePath: string }) => void;
  readDenied: ({ sourcePath }: { sourcePath: string }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const fileProxy = readFileProxy();
  const idProxy = runIdBrokerProxy();
  const loadProxy = runLoadBrokerProxy();

  return {
    savedRun: ({ sourcePath, harnessPath, source, configDir, runId, run }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      idProxy.noHarness({ harnessPath });
      loadProxy.savedRun({ configDir, runId, run });
    },
    neverRun: ({ sourcePath, harnessPath, source, configDir, runId }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      idProxy.noHarness({ harnessPath });
      loadProxy.noSuchRun({ configDir, runId });
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
