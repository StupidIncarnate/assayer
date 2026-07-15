import { readConditionLayerAdapterProxy } from './read-condition-layer-adapter.proxy';
import { readOperandTypeLayerAdapterProxy } from './read-operand-type-layer-adapter.proxy';

export const readConditionTreeLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readConditionLayerAdapterProxy();
  readOperandTypeLayerAdapterProxy();

  return {};
};
