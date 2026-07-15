import { deriveBranchIdLayerAdapterProxy } from './derive-branch-id-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';
import { readConditionTreeLayerAdapterProxy } from './read-condition-tree-layer-adapter.proxy';

export const handleIfLayerAdapterProxy = (): Record<PropertyKey, never> => {
  deriveBranchIdLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readAccountedLayerAdapterProxy();
  readConditionTreeLayerAdapterProxy();

  return {};
};
