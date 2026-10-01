import { readTypeFactLayerTransformerProxy } from './read-type-fact-layer-transformer.proxy';

export const readOperandTypeLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readTypeFactLayerTransformerProxy();

  return {};
};
