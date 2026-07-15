import { handleBlockLayerAdapterProxy } from './handle-block-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';

export const handleSourceFileLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readAccountedLayerAdapterProxy();

  return {};
};
