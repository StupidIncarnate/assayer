import { readTerminalLayerTransformerProxy } from './read-terminal-layer-transformer.proxy';

export const readAccountedLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readTerminalLayerTransformerProxy();

  return {};
};
