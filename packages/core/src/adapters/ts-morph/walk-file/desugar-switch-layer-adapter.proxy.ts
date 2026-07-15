import { projectNodeLayerAdapterProxy } from './project-node-layer-adapter.proxy';

export const desugarSwitchLayerAdapterProxy = (): Record<PropertyKey, never> => {
  projectNodeLayerAdapterProxy();

  return {};
};
