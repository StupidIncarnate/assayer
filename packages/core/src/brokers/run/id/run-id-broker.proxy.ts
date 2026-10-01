import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// The broker looks for a colocated harness at `harnessPath`, so each scenario names that path and
// stages the existence check and the read for exactly it. A test that stages no scenario reaches an
// unstaged call, which throws.
export const runIdBrokerProxy = (): {
  noHarness: ({ harnessPath }: { harnessPath: string }) => void;
  harness: ({ harnessPath, source }: { harnessPath: string; source: string }) => void;
  readThrows: ({ harnessPath }: { harnessPath: string }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const fileProxy = readFileProxy();

  return {
    noHarness: ({ harnessPath }: { harnessPath: string }): void => {
      existsProxy.missing({ path: harnessPath });
    },
    harness: ({ harnessPath, source }: { harnessPath: string; source: string }): void => {
      existsProxy.present({ path: harnessPath });
      fileProxy.returns({ path: harnessPath, contents: source });
    },
    // The harness read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES
    // and the like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ harnessPath }: { harnessPath: string }): void => {
      existsProxy.present({ path: harnessPath });
      fileProxy.denied({ path: harnessPath });
    },
  };
};
