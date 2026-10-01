import { window } from '#gateway/browser/window';
import { RunConsoleStub } from '@assayer/shared/contracts/run-console/run-console.stub';

export const runFetchConsoleBrokerProxy = (): {
  setupConsole: (params: { console: ReturnType<typeof RunConsoleStub> }) => void;
  neverRun: () => void;
} => {
  const state: { console: ReturnType<typeof RunConsoleStub> | undefined } = { console: RunConsoleStub() };
  window.assayerBridge = {
    ...window.assayerBridge,
    getSavedConsole: async (): Promise<unknown> => Promise.resolve(state.console),
  };
  const adapterProxy = {
    returns: ({ console: consoleText }: { console: ReturnType<typeof RunConsoleStub> }): void => {
      state.console = consoleText;
    },
    neverRun: (): void => {
      state.console = undefined;
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getSavedConsole');
      }
    },
  };

  return {
    setupConsole: ({ console: consoleText }: { console: ReturnType<typeof RunConsoleStub> }): void => {
      adapterProxy.returns({ console: consoleText });
    },
    neverRun: (): void => {
      adapterProxy.neverRun();
    },
  };
};
