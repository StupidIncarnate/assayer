import { runLoadBrokerProxy } from '@assayer/core/brokers/run/load/run-load-broker.proxy';
import type { RunResult } from '@assayer/shared/contracts';

export const DetailShowResponderProxy = (): {
  savedRun: ({ configDir, runId, run }: { configDir: string; runId: string; run: RunResult }) => void;
  noSuchRun: ({ configDir, runId }: { configDir: string; runId: string }) => void;
} => {
  const loadProxy = runLoadBrokerProxy();

  return {
    savedRun: ({ configDir, runId, run }: { configDir: string; runId: string; run: RunResult }): void => {
      loadProxy.savedRun({ configDir, runId, run });
    },
    noSuchRun: ({ configDir, runId }: { configDir: string; runId: string }): void => {
      loadProxy.noSuchRun({ configDir, runId });
    },
  };
};
