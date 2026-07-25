import { readDeclaredTypeTextLayerAdapterProxy } from './read-declared-type-text-layer-adapter.proxy';

export const readTypeFactLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readDeclaredTypeTextLayerAdapterProxy();

  return {};
};
