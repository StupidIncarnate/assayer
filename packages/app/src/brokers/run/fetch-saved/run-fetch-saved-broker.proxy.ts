import { assayerBridgeGetSavedRunAdapterProxy } from '../../../adapters/assayer-bridge/get-saved-run/assayer-bridge-get-saved-run-adapter.proxy';
import type { RunResultStub } from '@assayer/shared/contracts';

export const runFetchSavedBrokerProxy = (): {
  setupRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  neverRun: () => void;
} => {
  const adapterProxy = assayerBridgeGetSavedRunAdapterProxy();

  return {
    setupRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      adapterProxy.returns({ run });
    },
    neverRun: (): void => {
      adapterProxy.neverRun();
    },
  };
};
