import { readDeclaredTypeTextLayerTransformerProxy } from './read-declared-type-text-layer-transformer.proxy';

export const readTypeFactLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readDeclaredTypeTextLayerTransformerProxy();

  return {};
};
