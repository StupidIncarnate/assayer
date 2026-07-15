import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

export const handleExitLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();

  return {};
};
