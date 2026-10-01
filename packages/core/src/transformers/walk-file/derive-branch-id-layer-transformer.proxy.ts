import { projectNodeLayerTransformerProxy } from './project-node-layer-transformer.proxy';

export const deriveBranchIdLayerTransformerProxy = (): Record<PropertyKey, never> => {
  projectNodeLayerTransformerProxy();

  return {};
};
