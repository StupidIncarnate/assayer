import { handleBlockLayerTransformerProxy } from './handle-block-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAccountedLayerTransformerProxy } from './read-accounted-layer-transformer.proxy';
import { readConditionalExitLayerTransformerProxy } from './read-conditional-exit-layer-transformer.proxy';
import { readConditionTreeLayerTransformerProxy } from './read-condition-tree-layer-transformer.proxy';
import { readDeclaredTypeTextLayerTransformerProxy } from './read-declared-type-text-layer-transformer.proxy';
import { readEntryAccessLayerTransformerProxy } from './read-entry-access-layer-transformer.proxy';
import { readExportFlagLayerTransformerProxy } from './read-export-flag-layer-transformer.proxy';
import { readFunctionNameLayerTransformerProxy } from './read-function-name-layer-transformer.proxy';
import { readTypeFactLayerTransformerProxy } from './read-type-fact-layer-transformer.proxy';

export const handleFunctionLayerTransformerProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  readAccountedLayerTransformerProxy();
  readConditionalExitLayerTransformerProxy();
  readConditionTreeLayerTransformerProxy();
  readDeclaredTypeTextLayerTransformerProxy();
  readEntryAccessLayerTransformerProxy();
  readExportFlagLayerTransformerProxy();
  readFunctionNameLayerTransformerProxy();
  readTypeFactLayerTransformerProxy();

  return {};
};
