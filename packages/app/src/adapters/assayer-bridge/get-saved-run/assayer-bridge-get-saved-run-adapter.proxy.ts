/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.getSavedRun. The
 * proxy stands it up over jsdom and MERGES onto any existing window.assayerBridge so it composes
 * with the other bridge proxies.
 */
import { RunResultStub } from '@assayer/shared/contracts';

export const assayerBridgeGetSavedRunAdapterProxy = (): {
  returns: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  neverRun: () => void;
  absent: () => void;
} => {
  const state: { run: ReturnType<typeof RunResultStub> | undefined } = { run: RunResultStub() };

  window.assayerBridge = {
    ...window.assayerBridge,
    getSavedRun: async (): Promise<unknown> => Promise.resolve(state.run),
  };

  return {
    returns: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      state.run = run;
    },
    neverRun: (): void => {
      state.run = undefined;
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getSavedRun');
      }
    },
  };
};
