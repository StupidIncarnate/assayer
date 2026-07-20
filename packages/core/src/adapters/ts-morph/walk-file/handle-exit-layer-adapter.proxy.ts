import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readConditionalExitLayerAdapterProxy } from './read-conditional-exit-layer-adapter.proxy';

export const handleExitLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();
  readConditionalExitLayerAdapterProxy();

  return {};
};
