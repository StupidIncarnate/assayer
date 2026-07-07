import { electronDesktopBootAdapterProxy } from '../../../adapters/electron/desktop-boot/electron-desktop-boot-adapter.proxy';
import { statusResolveBrokerProxy } from '../../../brokers/status/resolve/status-resolve-broker.proxy';

export const DesktopMainBootResponderProxy = (): Record<PropertyKey, never> => {
  electronDesktopBootAdapterProxy();
  statusResolveBrokerProxy();

  return {};
};
