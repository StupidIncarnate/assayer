import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readTypeFactLayerTransformerProxy } from './read-type-fact-layer-transformer.proxy';

export const handleClassLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();
  readTypeFactLayerTransformerProxy();

  return {};
};
