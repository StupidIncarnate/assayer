import { readTerminalLayerAdapterProxy } from './read-terminal-layer-adapter.proxy';

export const readAccountedLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readTerminalLayerAdapterProxy();

  return {};
};
