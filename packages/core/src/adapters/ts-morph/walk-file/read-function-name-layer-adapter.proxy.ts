import { projectNodeLayerAdapterProxy } from './project-node-layer-adapter.proxy';

export const readFunctionNameLayerAdapterProxy = (): Record<PropertyKey, never> => {
  projectNodeLayerAdapterProxy();

  return {};
};
