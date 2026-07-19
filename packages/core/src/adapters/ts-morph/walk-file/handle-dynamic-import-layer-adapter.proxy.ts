import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

export const handleDynamicImportLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();

  return {};
};
