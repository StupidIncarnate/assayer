import { assayerBridgeGetSavedConsoleAdapterProxy } from '../../../adapters/assayer-bridge/get-saved-console/assayer-bridge-get-saved-console-adapter.proxy';
import type { RunConsoleStub } from '@assayer/shared/contracts';

export const runFetchConsoleBrokerProxy = (): {
  setupConsole: (params: { console: ReturnType<typeof RunConsoleStub> }) => void;
  neverRun: () => void;
} => {
  const adapterProxy = assayerBridgeGetSavedConsoleAdapterProxy();

  return {
    setupConsole: ({ console: consoleText }: { console: ReturnType<typeof RunConsoleStub> }): void => {
      adapterProxy.returns({ console: consoleText });
    },
    neverRun: (): void => {
      adapterProxy.neverRun();
    },
  };
};
