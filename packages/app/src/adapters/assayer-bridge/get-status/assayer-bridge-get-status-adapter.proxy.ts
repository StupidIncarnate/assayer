/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge — the
 * contextBridge object the Electron preload injects at runtime. jsdom has no such global, so the
 * proxy stands it up (default: resolves a stub) and can also remove it via absent() to exercise the
 * missing-preload guard. Mocking the boundary, not the adapter, keeps the adapter body running real.
 */
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

export const assayerBridgeGetStatusAdapterProxy = (): {
  returns: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
  absent: () => void;
} => {
  window.assayerBridge = { getStatus: async (): Promise<unknown> => Promise.resolve(StatusViewStub()) };

  return {
    returns: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      window.assayerBridge = { getStatus: async (): Promise<unknown> => Promise.resolve(status) };
    },
    absent: (): void => {
      Reflect.deleteProperty(window, 'assayerBridge');
    },
  };
};
