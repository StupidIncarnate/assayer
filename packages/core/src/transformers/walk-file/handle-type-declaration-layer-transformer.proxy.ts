import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readTypeFactLayerTransformerProxy } from './read-type-fact-layer-transformer.proxy';

export const handleTypeDeclarationLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();
  readTypeFactLayerTransformerProxy();

  return {};
};
