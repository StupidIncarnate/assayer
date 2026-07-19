import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAmbientRootLayerAdapterProxy } from './read-ambient-root-layer-adapter.proxy';
import { readCallArgsLayerAdapterProxy } from './read-call-args-layer-adapter.proxy';

export const handleMemberAccessLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerAdapterProxy();
  readAmbientRootLayerAdapterProxy();
  readCallArgsLayerAdapterProxy();

  return {};
};
