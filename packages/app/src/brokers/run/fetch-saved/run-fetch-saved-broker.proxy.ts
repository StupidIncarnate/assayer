import { window } from '#gateway/browser/window';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

export const runFetchSavedBrokerProxy = (): {
  setupRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  neverRun: () => void;
} => {
  const state: { run: ReturnType<typeof RunResultStub> | undefined } = { run: RunResultStub() };
  window.assayerBridge = {
    ...window.assayerBridge,
    getSavedRun: async (): Promise<unknown> => Promise.resolve(state.run),
  };
  const adapterProxy = {
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

  return {
    setupRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      adapterProxy.returns({ run });
    },
    neverRun: (): void => {
      adapterProxy.neverRun();
    },
  };
};
