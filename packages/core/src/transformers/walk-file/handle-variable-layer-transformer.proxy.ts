import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAmbientRootLayerTransformerProxy } from './read-ambient-root-layer-transformer.proxy';
import { readCalleeLayerTransformerProxy } from './read-callee-layer-transformer.proxy';

export const handleVariableLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();
  readAmbientRootLayerTransformerProxy();
  readCalleeLayerTransformerProxy();

  return {};
};
