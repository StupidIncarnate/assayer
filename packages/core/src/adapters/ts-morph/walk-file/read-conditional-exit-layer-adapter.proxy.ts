import { flattenShortCircuitLayerAdapterProxy } from './flatten-short-circuit-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { projectNodeLayerAdapterProxy } from './project-node-layer-adapter.proxy';
import { readConditionTreeLayerAdapterProxy } from './read-condition-tree-layer-adapter.proxy';
import { readNullishLeafLayerAdapterProxy } from './read-nullish-leaf-layer-adapter.proxy';

export const readConditionalExitLayerAdapterProxy = (): Record<PropertyKey, never> => {
  flattenShortCircuitLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  projectNodeLayerAdapterProxy();
  readConditionTreeLayerAdapterProxy();
  readNullishLeafLayerAdapterProxy();

  return {};
};
