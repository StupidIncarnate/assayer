import { readModuleExportLayerAdapterProxy } from './read-module-export-layer-adapter.proxy';

export const readExportFlagLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readModuleExportLayerAdapterProxy();

  return {};
};
