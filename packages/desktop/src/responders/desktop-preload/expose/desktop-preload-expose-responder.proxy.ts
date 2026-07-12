import { electronPreloadBridgeAdapterProxy } from '../../../adapters/electron/preload-bridge/electron-preload-bridge-adapter.proxy';

export const DesktopPreloadExposeResponderProxy = (): {
  exposedBridgeKey: () => unknown;
  triggerGetCompiledTree: () => Promise<void>;
  triggerGetCompiledFile: (params: { relPath: string }) => Promise<void>;
  lastInvokeArgs: () => unknown[];
} => {
  const adapterProxy = electronPreloadBridgeAdapterProxy();

  return {
    exposedBridgeKey: (): unknown => adapterProxy.exposedBridgeKey(),
    triggerGetCompiledTree: async (): Promise<void> => adapterProxy.triggerGetCompiledTree(),
    triggerGetCompiledFile: async ({ relPath }: { relPath: string }): Promise<void> =>
      adapterProxy.triggerGetCompiledFile({ relPath }),
    lastInvokeArgs: (): unknown[] => adapterProxy.lastInvokeArgs(),
  };
};
