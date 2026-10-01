import { readCalleeLayerTransformerProxy } from './read-callee-layer-transformer.proxy';

export const readCallArgsLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readCalleeLayerTransformerProxy();

  return {};
};
