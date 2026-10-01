import { window } from '#gateway/browser/window';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

export const runExecuteBrokerProxy = (): {
  setupRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  fails: (params: { message: string }) => void;
} => {
  const state: { run: ReturnType<typeof RunResultStub>; error?: string } = { run: RunResultStub() };
  window.assayerBridge = {
    ...window.assayerBridge,
    runFile: async (): Promise<unknown> => {
      const { error } = state;

      if (error !== undefined) {
        return Promise.reject(new Error(error));
      }

      return Promise.resolve(state.run);
    },
  };
  const adapterProxy = {
    returns: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      state.run = run;
    },
    fails: ({ message }: { message: string }): void => {
      state.error = message;
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'runFile');
      }
    },
  };

  return {
    setupRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      adapterProxy.returns({ run });
    },
    fails: ({ message }: { message: string }): void => {
      adapterProxy.fails({ message });
    },
  };
};
