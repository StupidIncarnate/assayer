import { handleBlockLayerTransformerProxy } from './handle-block-layer-transformer.proxy';
import { handleCallLayerTransformerProxy } from './handle-call-layer-transformer.proxy';
import { handleClassLayerTransformerProxy } from './handle-class-layer-transformer.proxy';
import { handleDynamicImportLayerTransformerProxy } from './handle-dynamic-import-layer-transformer.proxy';
import { handleExitLayerTransformerProxy } from './handle-exit-layer-transformer.proxy';
import { handleExportLayerTransformerProxy } from './handle-export-layer-transformer.proxy';
import { handleFunctionLayerTransformerProxy } from './handle-function-layer-transformer.proxy';
import { handleIfLayerTransformerProxy } from './handle-if-layer-transformer.proxy';
import { handleImportLayerTransformerProxy } from './handle-import-layer-transformer.proxy';
import { handleMemberAccessLayerTransformerProxy } from './handle-member-access-layer-transformer.proxy';
import { handleSourceFileLayerTransformerProxy } from './handle-source-file-layer-transformer.proxy';
import { handleSwitchLayerTransformerProxy } from './handle-switch-layer-transformer.proxy';
import { handleTypeDeclarationLayerTransformerProxy } from './handle-type-declaration-layer-transformer.proxy';
import { handleVariableLayerTransformerProxy } from './handle-variable-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';

export const dispatchNodeLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerTransformerProxy();
  handleCallLayerTransformerProxy();
  handleClassLayerTransformerProxy();
  handleDynamicImportLayerTransformerProxy();
  handleExitLayerTransformerProxy();
  handleExportLayerTransformerProxy();
  handleFunctionLayerTransformerProxy();
  handleIfLayerTransformerProxy();
  handleImportLayerTransformerProxy();
  handleMemberAccessLayerTransformerProxy();
  handleSourceFileLayerTransformerProxy();
  handleSwitchLayerTransformerProxy();
  handleTypeDeclarationLayerTransformerProxy();
  handleVariableLayerTransformerProxy();
  handlerResultLayerTransformerProxy();

  return {};
};
