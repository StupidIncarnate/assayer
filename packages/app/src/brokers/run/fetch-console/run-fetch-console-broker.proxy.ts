import { window } from '#gateway/browser/window';

export const runFetchConsoleBrokerProxy = (): {
  setupConsole: (params: { console: string }) => void;
  neverRun: () => void;
} => {
  const state: { console: string | undefined } = { console: 'src/a.ts  1/1 passed\n' };
  window.assayerBridge = {
    ...window.assayerBridge,
    getSavedConsole: async (): Promise<unknown> => Promise.resolve(state.console),
  };
  const adapterProxy = {
    returns: ({ console: consoleText }: { console: string }): void => {
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
    setupConsole: ({ console: consoleText }: { console: string }): void => {
      adapterProxy.returns({ console: consoleText });
    },
    neverRun: (): void => {
      adapterProxy.neverRun();
    },
  };
};
