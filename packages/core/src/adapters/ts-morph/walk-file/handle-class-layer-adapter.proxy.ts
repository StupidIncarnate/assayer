import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

export const handleClassLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();

  return {};
};
