import { runPathsBrokerProxy } from '@assayer/core/brokers/run/paths/run-paths-broker.proxy';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

import { analyzerRootsResolveBrokerProxy } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.proxy';
import { RunReportLayerResponderProxy } from './run-report-layer-responder.proxy';
import { join } from '#gateway/node/path';

export const UnitRunResponderProxy = (): {
  runsEachPath: (params: {
    configDir: string;
    root: string;
    runs: readonly { relPath: string; result: ReturnType<typeof RunResultStub> }[];
  }) => void;
  getRunPathsCalls: () => readonly { relPaths: readonly string[]; root: string; cacheDir: string }[];
  getSavedConsoles: (params: { configDir: string }) => unknown[];
} => {
  const pathsProxy = runPathsBrokerProxy();
  const rootsProxy = analyzerRootsResolveBrokerProxy();
  const reportProxy = RunReportLayerResponderProxy();
  // Saved reports are read back under the stub's run id, so a test that reads them stages results
  // that carry it.
  const { runId } = RunResultStub();
  // The monorepo root sits six levels above this proxy's directory: run, unit, responders, src, cli,
  // packages.
  const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');

  return {
    // Core's package root is found, the analyzer roots resolve from the real module location, and
    // each path answers with the result the test gave it and has its run saved under configDir.
    runsEachPath: ({
      configDir,
      root,
      runs,
    }: {
      configDir: string;
      root: string;
      runs: readonly { relPath: string; result: ReturnType<typeof RunResultStub> }[];
    }): void => {
      pathsProxy.coreRootFound();
      rootsProxy.rootAboveThisModule();
      pathsProxy.runsEachPath({
        configDir,
        root,
        analyzerRoots: [
          join(monorepoRoot, 'packages', 'core', 'src'),
          join(monorepoRoot, 'packages', 'shared', 'src'),
        ],
        runs,
      });
      runs.forEach(({ result }) => {
        reportProxy.saveSucceeds({ configDir, runId: String(result.runId) });
      });
    },
    // Every call `runPathsBroker` received, in order: the paths, the root and the cache directory.
    getRunPathsCalls: (): readonly { relPaths: readonly string[]; root: string; cacheDir: string }[] =>
      pathsProxy.getCallsFor(),
    // Every report body saved for the run, in call order.
    getSavedConsoles: ({ configDir }: { configDir: string }): unknown[] =>
      reportProxy.getSavedConsoles({ configDir, runId: String(runId) }),
  };
};
