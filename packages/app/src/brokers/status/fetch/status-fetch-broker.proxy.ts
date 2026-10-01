import { window } from '#gateway/browser/window';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

export const statusFetchBrokerProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  window.assayerBridge = {
    ...window.assayerBridge,
    getStatus: async (): Promise<unknown> => Promise.resolve(StatusViewStub()),
  };
  const adapterProxy = {
    returns: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getStatus: async (): Promise<unknown> => Promise.resolve(status),
      };
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getStatus');
      }
    },
  };

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      adapterProxy.returns({ status });
    },
  };
};
