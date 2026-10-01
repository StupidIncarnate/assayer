import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';

export const handleDynamicImportLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handlerResultLayerTransformerProxy();

  return {};
};
