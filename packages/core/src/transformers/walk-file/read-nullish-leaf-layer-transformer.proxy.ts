import { readOperandTypeLayerTransformerProxy } from './read-operand-type-layer-transformer.proxy';

export const readNullishLeafLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readOperandTypeLayerTransformerProxy();

  return {};
};
