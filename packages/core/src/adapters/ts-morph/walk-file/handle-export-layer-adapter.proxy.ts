import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

export const handleExportLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();

  return {};
};
