import { runPathsBrokerProxy } from '@assayer/core/testing';
import { RunResultStub } from '@assayer/shared/contracts';

import { analyzerRootsResolveBrokerProxy } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.proxy';
import { RunReportLayerResponderProxy } from './run-report-layer-responder.proxy';

export const UnitRunResponderProxy = (): {
  runsEachPath: (params: { configDir: string }) => void;
  getSavedConsoles: (params: { configDir: string }) => unknown[];
} => {
  const pathsProxy = runPathsBrokerProxy();
  const rootsProxy = analyzerRootsResolveBrokerProxy();
  const reportProxy = RunReportLayerResponderProxy();
  // runPathsBrokerProxy answers every path with one RunResultStub, so every run carries its run id.
  const { runId } = RunResultStub();

  return {
    // Core's package root is found, the analyzer roots resolve from the real module location, and
    // each path's run is saved under configDir.
    runsEachPath: ({ configDir }: { configDir: string }): void => {
      pathsProxy.coreRootFound();
      rootsProxy.rootAboveThisModule();
      reportProxy.saveSucceeds({ configDir, runId: String(runId) });
    },
    // Every report body saved for the run, in call order.
    getSavedConsoles: ({ configDir }: { configDir: string }): unknown[] =>
      reportProxy.getSavedConsoles({ configDir, runId: String(runId) }),
  };
};
