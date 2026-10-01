/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.getSavedConsole. The
 * proxy stands it up over jsdom and MERGES onto any existing window.assayerBridge so it composes with
 * the other bridge proxies.
 */
import { RunConsoleStub } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';

export const assayerBridgeGetSavedConsoleAdapterProxy = (): {
  returns: (params: { console: ReturnType<typeof RunConsoleStub> }) => void;
  neverRun: () => void;
  absent: () => void;
} => {
  const state: { console: ReturnType<typeof RunConsoleStub> | undefined } = { console: RunConsoleStub() };

  window.assayerBridge = {
    ...window.assayerBridge,
    getSavedConsole: async (): Promise<unknown> => Promise.resolve(state.console),
  };

  return {
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
};
