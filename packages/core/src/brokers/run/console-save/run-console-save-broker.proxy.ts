import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const runConsoleSaveBrokerProxy = (): {
  succeeds: ({ configDir, runId }: { configDir: string; runId: string }) => void;
  // Every body written to the path, in call order. A write to any other path is not staged, so it
  // throws.
  getWrittenContentsFor: ({ path }: { path: string }) => unknown[];
  // Every mkdir of the directory, as full argument tuples.
  getMkdirCalls: ({ path }: { path: string }) => readonly unknown[][];
} => {
  const dirProxy = ensureDirProxy();
  const fileProxy = writeFileProxy();

  return {
    succeeds: ({ configDir, runId }: { configDir: string; runId: string }): void => {
      const runDir = `${configDir}/.assayer/cache/runs/${runId}`;
      dirProxy.succeeds({ path: runDir });
      fileProxy.succeeds({ path: `${runDir}/console.txt` });
    },
    getWrittenContentsFor: ({ path }: { path: string }): unknown[] =>
      fileProxy.getCallsFor({ path }).map((call) => call[1]),
    getMkdirCalls: ({ path }: { path: string }): readonly unknown[][] =>
      dirProxy.getCallsFor({ path }),
  };
};
