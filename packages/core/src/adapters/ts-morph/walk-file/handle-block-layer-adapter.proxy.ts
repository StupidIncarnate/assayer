import { deriveBranchIdLayerAdapterProxy } from './derive-branch-id-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readTerminalLayerAdapterProxy } from './read-terminal-layer-adapter.proxy';
import { readValueFlowExitLayerAdapterProxy } from './read-value-flow-exit-layer-adapter.proxy';

export const handleBlockLayerAdapterProxy = (): Record<PropertyKey, never> => {
  deriveBranchIdLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readTerminalLayerAdapterProxy();
  readValueFlowExitLayerAdapterProxy();

  return {};
};
