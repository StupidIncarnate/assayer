import { walkNodeLayerAdapterProxy } from './walk-node-layer-adapter.proxy';

export const tsMorphWalkFileAdapterProxy = (): Record<PropertyKey, never> => {
  walkNodeLayerAdapterProxy();

  return {};
};
