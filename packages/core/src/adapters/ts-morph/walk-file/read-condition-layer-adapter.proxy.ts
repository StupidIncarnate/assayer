import { readPropertyPathLayerAdapterProxy } from './read-property-path-layer-adapter.proxy';

export const readConditionLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readPropertyPathLayerAdapterProxy();

  return {};
};
