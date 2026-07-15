import { deriveBranchIdLayerAdapterProxy } from './derive-branch-id-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';
import { readConditionLayerAdapterProxy } from './read-condition-layer-adapter.proxy';
import { readOperandTypeLayerAdapterProxy } from './read-operand-type-layer-adapter.proxy';

export const handleIfLayerAdapterProxy = (): Record<PropertyKey, never> => {
  deriveBranchIdLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readAccountedLayerAdapterProxy();
  readConditionLayerAdapterProxy();
  readOperandTypeLayerAdapterProxy();

  return {};
};
