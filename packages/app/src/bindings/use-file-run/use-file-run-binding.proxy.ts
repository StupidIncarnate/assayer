import { runExecuteBrokerProxy } from '../../brokers/run/execute/run-execute-broker.proxy';
import { runFetchSavedBrokerProxy } from '../../brokers/run/fetch-saved/run-fetch-saved-broker.proxy';
import type { RunResultStub } from '@assayer/shared/contracts';

export const useFileRunBindingProxy = (): {
  setupSavedRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  neverRun: () => void;
  setupRunResult: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  runFails: (params: { message: string }) => void;
} => {
  const savedProxy = runFetchSavedBrokerProxy();
  const executeProxy = runExecuteBrokerProxy();

  return {
    setupSavedRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      savedProxy.setupRun({ run });
    },
    neverRun: (): void => {
      savedProxy.neverRun();
    },
    setupRunResult: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      executeProxy.setupRun({ run });
    },
    runFails: ({ message }: { message: string }): void => {
      executeProxy.fails({ message });
    },
  };
};
