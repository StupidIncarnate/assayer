import { handleBlockLayerAdapterProxy } from './handle-block-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';
import { readConditionalExitLayerAdapterProxy } from './read-conditional-exit-layer-adapter.proxy';
import { readConditionTreeLayerAdapterProxy } from './read-condition-tree-layer-adapter.proxy';
import { readEntryAccessLayerAdapterProxy } from './read-entry-access-layer-adapter.proxy';
import { readExportFlagLayerAdapterProxy } from './read-export-flag-layer-adapter.proxy';
import { readFunctionNameLayerAdapterProxy } from './read-function-name-layer-adapter.proxy';
import { readTypeFactLayerAdapterProxy } from './read-type-fact-layer-adapter.proxy';

export const handleFunctionLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readAccountedLayerAdapterProxy();
  readConditionalExitLayerAdapterProxy();
  readConditionTreeLayerAdapterProxy();
  readEntryAccessLayerAdapterProxy();
  readExportFlagLayerAdapterProxy();
  readFunctionNameLayerAdapterProxy();
  readTypeFactLayerAdapterProxy();

  return {};
};
