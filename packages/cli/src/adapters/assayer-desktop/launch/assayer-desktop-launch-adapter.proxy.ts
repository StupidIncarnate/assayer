import { desktopLaunchBrokerProxy } from '@assayer/desktop/testing';

export const assayerDesktopLaunchAdapterProxy = (): Record<PropertyKey, never> => {
  desktopLaunchBrokerProxy();

  return {};
};
