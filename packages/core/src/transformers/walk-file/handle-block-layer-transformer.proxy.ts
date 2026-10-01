import { deriveBranchIdLayerTransformerProxy } from './derive-branch-id-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readTerminalLayerTransformerProxy } from './read-terminal-layer-transformer.proxy';
import { readValueFlowExitLayerTransformerProxy } from './read-value-flow-exit-layer-transformer.proxy';

export const handleBlockLayerTransformerProxy = (): Record<PropertyKey, never> => {
  deriveBranchIdLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  readTerminalLayerTransformerProxy();
  readValueFlowExitLayerTransformerProxy();

  return {};
};
