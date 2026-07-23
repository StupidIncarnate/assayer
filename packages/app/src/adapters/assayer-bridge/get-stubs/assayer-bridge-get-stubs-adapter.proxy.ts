/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.getStubs — the
 * contextBridge method the Electron preload injects. jsdom has no such global, so the proxy stands it up
 * (default: resolves a stub view). It MERGES onto any existing window.assayerBridge so it composes with
 * other bridge-method proxies. Mocking the boundary, not the adapter, keeps the adapter body running real.
 */
import { StubViewStub } from '@assayer/shared/contracts';

export const assayerBridgeGetStubsAdapterProxy = (): {
  returns: (params: { view: ReturnType<typeof StubViewStub> }) => void;
  rejects: (params: { error: Error }) => void;
  absent: () => void;
} => {
  window.assayerBridge = {
    ...window.assayerBridge,
    getStubs: async (): Promise<unknown> => Promise.resolve(StubViewStub()),
  };

  return {
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
};
