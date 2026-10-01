import { desktopBridgeExposeBrokerProxy } from '../../../brokers/desktop-bridge/expose/desktop-bridge-expose-broker.proxy';

export const DesktopPreloadExposeResponderProxy = (): {
  exposedBridgeKeys: () => unknown[];
  triggerGetCompiledTree: () => Promise<void>;
  triggerGetCompiledFile: (params: { relPath: string }) => Promise<void>;
  invokedArgs: () => unknown[][];
} => {
  const adapterProxy = desktopBridgeExposeBrokerProxy();

  return {
    exposedBridgeKeys: (): unknown[] => adapterProxy.exposedBridgeKeys(),
    triggerGetCompiledTree: async (): Promise<void> => adapterProxy.triggerGetCompiledTree(),
    triggerGetCompiledFile: async ({ relPath }: { relPath: string }): Promise<void> =>
      adapterProxy.triggerGetCompiledFile({ relPath }),
    invokedArgs: (): unknown[][] => adapterProxy.invokedArgs(),
  };
};
