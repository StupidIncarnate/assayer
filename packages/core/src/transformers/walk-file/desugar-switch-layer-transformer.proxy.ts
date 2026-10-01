import { projectNodeLayerTransformerProxy } from './project-node-layer-transformer.proxy';

export const desugarSwitchLayerTransformerProxy = (): Record<PropertyKey, never> => {
  projectNodeLayerTransformerProxy();

  return {};
};
