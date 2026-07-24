import { assayerBridgeOnRunOutputAdapterProxy } from '../../adapters/assayer-bridge/on-run-output/assayer-bridge-on-run-output-adapter.proxy';
import { runExecuteBrokerProxy } from '../../brokers/run/execute/run-execute-broker.proxy';
import { runFetchConsoleBrokerProxy } from '../../brokers/run/fetch-console/run-fetch-console-broker.proxy';
import { runFetchSavedBrokerProxy } from '../../brokers/run/fetch-saved/run-fetch-saved-broker.proxy';
import type { RunConsoleStub, RunResultStub } from '@assayer/shared/contracts';

export const useFileRunBindingProxy = (): {
  setupSavedRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  setupSavedConsole: (params: { console: ReturnType<typeof RunConsoleStub> }) => void;
  neverRun: () => void;
  setupRunResult: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  runFails: (params: { message: string }) => void;
  emitRunOutput: (params: { chunk: string }) => void;
} => {
  const savedProxy = runFetchSavedBrokerProxy();
  const consoleProxy = runFetchConsoleBrokerProxy();
  const executeProxy = runExecuteBrokerProxy();
  const outputProxy = assayerBridgeOnRunOutputAdapterProxy();

  return {
    emitRunOutput: ({ chunk }: { chunk: string }): void => {
      outputProxy.emit({ chunk });
    },
    setupSavedRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      savedProxy.setupRun({ run });
    },
    setupSavedConsole: ({ console: consoleText }: { console: ReturnType<typeof RunConsoleStub> }): void => {
      consoleProxy.setupConsole({ console: consoleText });
    },
    // Both halves of a run are absent together: a file nobody has run has neither verdicts nor a
    // report, and so does a file edited since its last run, since both are keyed on content.
    neverRun: (): void => {
      savedProxy.neverRun();
      consoleProxy.neverRun();
    },
    setupRunResult: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      executeProxy.setupRun({ run });
    },
    runFails: ({ message }: { message: string }): void => {
      executeProxy.fails({ message });
    },
  };
};
