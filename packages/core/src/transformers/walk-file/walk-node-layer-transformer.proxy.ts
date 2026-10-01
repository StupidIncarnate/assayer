import { dispatchNodeLayerTransformerProxy } from './dispatch-node-layer-transformer.proxy';
import { walkFactsLayerTransformerProxy } from './walk-facts-layer-transformer.proxy';

export const walkNodeLayerTransformerProxy = (): Record<PropertyKey, never> => {
  dispatchNodeLayerTransformerProxy();
  walkFactsLayerTransformerProxy();

  return {};
};
