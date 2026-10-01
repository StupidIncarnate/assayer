import { handleBlockLayerTransformerProxy } from './handle-block-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAccountedLayerTransformerProxy } from './read-accounted-layer-transformer.proxy';

export const handleSourceFileLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  readAccountedLayerTransformerProxy();

  return {};
};
