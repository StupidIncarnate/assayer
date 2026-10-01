import { walkNodeLayerTransformerProxy } from './walk-node-layer-transformer.proxy';

export const walkFileTransformerProxy = (): Record<PropertyKey, never> => {
  walkNodeLayerTransformerProxy();

  return {};
};
