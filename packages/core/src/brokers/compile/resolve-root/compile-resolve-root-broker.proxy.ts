import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';

export const compileResolveRootBrokerProxy = (): Record<PropertyKey, never> => {
  pathResolveAdapterProxy();
  return {};
};
