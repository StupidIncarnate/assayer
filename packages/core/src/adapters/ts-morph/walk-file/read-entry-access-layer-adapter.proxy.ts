import { readFunctionNameLayerAdapterProxy } from './read-function-name-layer-adapter.proxy';
import { readModuleExportLayerAdapterProxy } from './read-module-export-layer-adapter.proxy';

export const readEntryAccessLayerAdapterProxy = (): Record<PropertyKey, never> => {
  readFunctionNameLayerAdapterProxy();
  readModuleExportLayerAdapterProxy();

  return {};
};
