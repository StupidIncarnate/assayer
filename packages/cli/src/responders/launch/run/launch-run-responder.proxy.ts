import { desktopLaunchBrokerProxy } from '@assayer/desktop/testing';

export const LaunchRunResponderProxy = (): Record<PropertyKey, never> => {
  desktopLaunchBrokerProxy();

  return {};
};
