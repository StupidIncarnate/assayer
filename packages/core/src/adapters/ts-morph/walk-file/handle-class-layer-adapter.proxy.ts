import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readTypeFactLayerAdapterProxy } from './read-type-fact-layer-adapter.proxy';

export const handleClassLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();
  readTypeFactLayerAdapterProxy();

  return {};
};
