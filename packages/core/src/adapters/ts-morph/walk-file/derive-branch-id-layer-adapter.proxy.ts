import { projectNodeLayerAdapterProxy } from './project-node-layer-adapter.proxy';

export const deriveBranchIdLayerAdapterProxy = (): Record<PropertyKey, never> => {
  projectNodeLayerAdapterProxy();

  return {};
};
