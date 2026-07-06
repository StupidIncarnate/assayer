import { assayerDesktopLaunchAdapterProxy } from '../../../adapters/assayer-desktop/launch/assayer-desktop-launch-adapter.proxy';

export const LaunchRunResponderProxy = (): Record<PropertyKey, never> => {
  assayerDesktopLaunchAdapterProxy();

  return {};
};
