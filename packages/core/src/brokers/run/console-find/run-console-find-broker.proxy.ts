import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// The broker reads the source (to derive the content-keyed run id) and then console.txt. The colocated
// harness check inside runIdBroker looks at `harnessPath` first, so every scenario stages it as absent.
// Each scenario names the paths it answers, so a read of any other path throws.
export const runConsoleFindBrokerProxy = (): {
  savedConsole: ({
    sourcePath,
    source,
    harnessPath,
    consolePath,
    console,
  }: {
    sourcePath: string;
    source: string;
    harnessPath: string;
    consolePath: string;
    console: string;
  }) => void;
  neverRun: ({
    sourcePath,
    source,
    harnessPath,
    consolePath,
  }: {
    sourcePath: string;
    source: string;
    harnessPath: string;
    consolePath: string;
  }) => void;
  fileMissing: ({ sourcePath }: { sourcePath: string }) => void;
  sourceReadDenied: ({ sourcePath }: { sourcePath: string }) => void;
  consoleReadDenied: ({
    sourcePath,
    source,
    harnessPath,
    consolePath,
  }: {
    sourcePath: string;
    source: string;
    harnessPath: string;
    consolePath: string;
  }) => void;
  getReadCalls: ({ path }: { path: string }) => readonly unknown[][];
} => {
  const existsProxy = pathExistsProxy();
  const fileProxy = readFileProxy();
  runIdBrokerProxy();

  return {
    savedConsole: ({
      sourcePath,
      source,
      harnessPath,
      consolePath,
      console: consoleText,
    }: {
      sourcePath: string;
      source: string;
      harnessPath: string;
      consolePath: string;
      console: string;
    }): void => {
      existsProxy.present({ path: sourcePath });
      existsProxy.missing({ path: harnessPath });
      existsProxy.present({ path: consolePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      fileProxy.returns({ path: consolePath, contents: consoleText });
    },
    neverRun: ({
      sourcePath,
      source,
      harnessPath,
      consolePath,
    }: {
      sourcePath: string;
      source: string;
      harnessPath: string;
      consolePath: string;
    }): void => {
      existsProxy.present({ path: sourcePath });
      existsProxy.missing({ path: harnessPath });
      existsProxy.missing({ path: consolePath });
      fileProxy.returns({ path: sourcePath, contents: source });
    },
    fileMissing: ({ sourcePath }: { sourcePath: string }): void => {
      existsProxy.missing({ path: sourcePath });
    },
    // Both reads are deliberately unwrapped -- no try/catch -- so a filesystem rejection propagates to
    // the caller unmodified.
    sourceReadDenied: ({ sourcePath }: { sourcePath: string }): void => {
      existsProxy.present({ path: sourcePath });
      fileProxy.denied({ path: sourcePath });
    },
    consoleReadDenied: ({
      sourcePath,
      source,
      harnessPath,
      consolePath,
    }: {
      sourcePath: string;
      source: string;
      harnessPath: string;
      consolePath: string;
    }): void => {
      existsProxy.present({ path: sourcePath });
      existsProxy.missing({ path: harnessPath });
      existsProxy.present({ path: consolePath });
      fileProxy.returns({ path: sourcePath, contents: source });
      fileProxy.denied({ path: consolePath });
    },
    getReadCalls: ({ path }: { path: string }): readonly unknown[][] =>
      fileProxy.getCallsFor({ path }),
  };
};
