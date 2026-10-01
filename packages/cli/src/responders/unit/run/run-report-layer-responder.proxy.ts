import { runConsoleSaveBrokerProxy } from '@assayer/core/brokers/run/console-save/run-console-save-broker.proxy';

export const RunReportLayerResponderProxy = (): {
  saveSucceeds: (params: { configDir: string; runId: string }) => void;
  // Every report body saved for one run, in call order. A save under any run id no test staged throws.
  getSavedConsoles: (params: { configDir: string; runId: string }) => unknown[];
} => {
  const saveProxy = runConsoleSaveBrokerProxy();

  return {
    saveSucceeds: ({ configDir, runId }: { configDir: string; runId: string }): void => {
      saveProxy.succeeds({ configDir, runId });
    },
    getSavedConsoles: ({ configDir, runId }: { configDir: string; runId: string }): unknown[] =>
      saveProxy.getWrittenContentsFor({ path: `${configDir}/.assayer/cache/runs/${runId}/console.txt` }),
  };
};
