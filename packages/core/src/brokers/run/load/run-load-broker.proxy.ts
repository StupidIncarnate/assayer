import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// Each scenario names the run it stages. A run no scenario staged reaches an unstaged call, which throws.
export const runLoadBrokerProxy = (): {
  savedRun: ({ configDir, runId, run }: { configDir: string; runId: string; run: unknown }) => void;
  noSuchRun: ({ configDir, runId }: { configDir: string; runId: string }) => void;
  readDenied: ({ configDir, runId }: { configDir: string; runId: string }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const fileProxy = readFileProxy();

  return {
    savedRun: ({ configDir, runId, run }: { configDir: string; runId: string; run: unknown }): void => {
      const path = `${configDir}/.assayer/cache/runs/${runId}/run.json`;
      existsProxy.present({ path });
      fileProxy.returns({ path, contents: JSON.stringify(run) });
    },
    noSuchRun: ({ configDir, runId }: { configDir: string; runId: string }): void => {
      existsProxy.missing({ path: `${configDir}/.assayer/cache/runs/${runId}/run.json` });
    },
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and the
    // like) propagates to the caller unmodified. This stages that rejection.
    readDenied: ({ configDir, runId }: { configDir: string; runId: string }): void => {
      const path = `${configDir}/.assayer/cache/runs/${runId}/run.json`;
      existsProxy.present({ path });
      fileProxy.denied({ path });
    },
  };
};
