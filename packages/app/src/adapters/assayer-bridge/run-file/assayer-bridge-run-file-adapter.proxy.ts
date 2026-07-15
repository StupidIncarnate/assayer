/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.runFile. The proxy
 * stands it up over jsdom and MERGES onto any existing window.assayerBridge so it composes with the
 * other bridge proxies.
 */
import { RunResultStub } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const assayerBridgeRunFileAdapterProxy = (): {
  returns: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  fails: (params: { message: string }) => void;
  absent: () => void;
} => {
  const state: { run: ReturnType<typeof RunResultStub>; error?: ErrorMessage } = { run: RunResultStub() };

  window.assayerBridge = {
    ...window.assayerBridge,
    runFile: async (): Promise<unknown> => {
      const { error } = state;

      if (error !== undefined) {
        return Promise.reject(new Error(String(error)));
      }

      return Promise.resolve(state.run);
    },
  };

  return {
    returns: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      state.run = run;
    },
    fails: ({ message }: { message: string }): void => {
      state.error = errorMessageContract.parse(message);
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'runFile');
      }
    },
  };
};
