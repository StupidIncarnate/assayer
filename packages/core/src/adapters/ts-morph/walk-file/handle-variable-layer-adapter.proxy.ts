import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAmbientRootLayerAdapterProxy } from './read-ambient-root-layer-adapter.proxy';
import { readCalleeLayerAdapterProxy } from './read-callee-layer-adapter.proxy';

export const handleVariableLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();
  readAmbientRootLayerAdapterProxy();
  readCalleeLayerAdapterProxy();

  return {};
};
