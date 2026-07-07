import { electronPreloadBridgeAdapterProxy } from '../../../adapters/electron/preload-bridge/electron-preload-bridge-adapter.proxy';

export const DesktopPreloadExposeResponderProxy = (): Record<PropertyKey, never> => {
  electronPreloadBridgeAdapterProxy();

  return {};
};
