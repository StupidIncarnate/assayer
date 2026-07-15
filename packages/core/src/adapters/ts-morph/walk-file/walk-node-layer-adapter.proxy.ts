import { dispatchNodeLayerAdapterProxy } from './dispatch-node-layer-adapter.proxy';
import { walkFactsLayerAdapterProxy } from './walk-facts-layer-adapter.proxy';

export const walkNodeLayerAdapterProxy = (): Record<PropertyKey, never> => {
  dispatchNodeLayerAdapterProxy();
  walkFactsLayerAdapterProxy();

  return {};
};
