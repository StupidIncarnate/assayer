import { readModuleExportLayerTransformerProxy } from './read-module-export-layer-transformer.proxy';

export const readExportFlagLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readModuleExportLayerTransformerProxy();

  return {};
};
