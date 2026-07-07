import { reactDomMountAdapterProxy } from '../../../adapters/react-dom/mount/react-dom-mount-adapter.proxy';

export const AppMountResponderProxy = (): Record<PropertyKey, never> => {
  reactDomMountAdapterProxy();

  return {};
};
