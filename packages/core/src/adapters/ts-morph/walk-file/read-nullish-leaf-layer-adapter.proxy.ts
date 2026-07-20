import { readOperandTypeLayerAdapterProxy } from './read-operand-type-layer-adapter.proxy';

export const readNullishLeafLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readOperandTypeLayerAdapterProxy();

  return {};
};
