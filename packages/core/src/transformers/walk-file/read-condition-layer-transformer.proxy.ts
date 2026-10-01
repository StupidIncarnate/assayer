import { readPropertyPathLayerTransformerProxy } from './read-property-path-layer-transformer.proxy';

export const readConditionLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readPropertyPathLayerTransformerProxy();

  return {};
};
