import { readCalleeLayerAdapterProxy } from './read-callee-layer-adapter.proxy';

export const readCallArgsLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readCalleeLayerAdapterProxy();

  return {};
};
