import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAmbientRootLayerAdapterProxy } from './read-ambient-root-layer-adapter.proxy';
import { readCallArgsLayerAdapterProxy } from './read-call-args-layer-adapter.proxy';
import { readCalleeLayerAdapterProxy } from './read-callee-layer-adapter.proxy';

export const handleCallLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();
  readAmbientRootLayerAdapterProxy();
  readCallArgsLayerAdapterProxy();
  readCalleeLayerAdapterProxy();

  return {};
};
