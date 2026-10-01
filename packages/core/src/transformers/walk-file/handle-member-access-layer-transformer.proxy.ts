import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAmbientRootLayerTransformerProxy } from './read-ambient-root-layer-transformer.proxy';
import { readCallArgsLayerTransformerProxy } from './read-call-args-layer-transformer.proxy';

export const handleMemberAccessLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();
  readAmbientRootLayerTransformerProxy();
  readCallArgsLayerTransformerProxy();

  return {};
};
