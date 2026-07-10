/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.getCompiledTree — the
 * contextBridge method the Electron preload injects. jsdom has no such global, so the proxy stands it up
 * (default: resolves a stub tree). It MERGES onto any existing window.assayerBridge so it composes with
 * other bridge-method proxies. Mocking the boundary, not the adapter, keeps the adapter body running real.
 */
import { CompiledTreeStub } from '@assayer/shared/contracts';

export const assayerBridgeGetCompiledTreeAdapterProxy = (): {
  returns: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  rejects: (params: { error: Error }) => void;
  absent: () => void;
} => {
  window.assayerBridge = {
    ...window.assayerBridge,
    getCompiledTree: async (): Promise<unknown> => Promise.resolve(CompiledTreeStub()),
  };

  return {
    returns: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getCompiledTree: async (): Promise<unknown> => Promise.resolve(tree),
      };
    },
    rejects: ({ error }: { error: Error }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getCompiledTree: async (): Promise<unknown> => Promise.reject(error),
      };
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getCompiledTree');
      }
    },
  };
};
