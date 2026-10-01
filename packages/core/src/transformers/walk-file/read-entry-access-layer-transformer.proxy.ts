import { readFunctionNameLayerTransformerProxy } from './read-function-name-layer-transformer.proxy';
import { readModuleExportLayerTransformerProxy } from './read-module-export-layer-transformer.proxy';

export const readEntryAccessLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readFunctionNameLayerTransformerProxy();
  readModuleExportLayerTransformerProxy();

  return {};
};
