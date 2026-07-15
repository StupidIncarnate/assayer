import { readTypeFactLayerAdapterProxy } from './read-type-fact-layer-adapter.proxy';

export const readOperandTypeLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readTypeFactLayerAdapterProxy();

  return {};
};
