import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readConditionalExitLayerTransformerProxy } from './read-conditional-exit-layer-transformer.proxy';

export const readValueFlowExitLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();
  readConditionalExitLayerTransformerProxy();

  return {};
};
