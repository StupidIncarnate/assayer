import { flattenShortCircuitLayerTransformerProxy } from './flatten-short-circuit-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { projectNodeLayerTransformerProxy } from './project-node-layer-transformer.proxy';
import { readConditionTreeLayerTransformerProxy } from './read-condition-tree-layer-transformer.proxy';
import { readNullishLeafLayerTransformerProxy } from './read-nullish-leaf-layer-transformer.proxy';

export const readConditionalExitLayerTransformerProxy = (): Record<PropertyKey, never> => {
  flattenShortCircuitLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  projectNodeLayerTransformerProxy();
  readConditionTreeLayerTransformerProxy();
  readNullishLeafLayerTransformerProxy();

  return {};
};
