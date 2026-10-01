import { deriveBranchIdLayerTransformerProxy } from './derive-branch-id-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAccountedLayerTransformerProxy } from './read-accounted-layer-transformer.proxy';
import { readConditionTreeLayerTransformerProxy } from './read-condition-tree-layer-transformer.proxy';

export const handleIfLayerTransformerProxy = (): Record<PropertyKey, never> => {
  deriveBranchIdLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  readAccountedLayerTransformerProxy();
  readConditionTreeLayerTransformerProxy();

  return {};
};
