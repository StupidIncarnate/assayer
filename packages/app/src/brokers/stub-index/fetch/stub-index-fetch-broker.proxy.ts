import { window } from '#gateway/browser/window';
import { StubViewStub } from '@assayer/shared/contracts/stub-view/stub-view.stub';

export const stubIndexFetchBrokerProxy = (): {
  setupView: (params: { view: ReturnType<typeof StubViewStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  window.assayerBridge = {
    ...window.assayerBridge,
    getStubs: async (): Promise<unknown> => Promise.resolve(StubViewStub()),
  };
  const adapterProxy = {
    returns: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getStubs: async (): Promise<unknown> => Promise.resolve(view),
      };
    },
    rejects: ({ error }: { error: Error }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getStubs: async (): Promise<unknown> => Promise.reject(error),
      };
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getStubs');
      }
    },
  };

  return {
    setupView: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      adapterProxy.returns({ view });
    },
    rejects: ({ error }: { error: Error }): void => {
      adapterProxy.rejects({ error });
    },
  };
};
