import { desugarSwitchLayerAdapterProxy } from './desugar-switch-layer-adapter.proxy';
import { handleBlockLayerAdapterProxy } from './handle-block-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';
import { readOperandTypeLayerAdapterProxy } from './read-operand-type-layer-adapter.proxy';

export const handleSwitchLayerAdapterProxy = (): Record<PropertyKey, never> => {
  desugarSwitchLayerAdapterProxy();
  handleBlockLayerAdapterProxy();
  handlerResultLayerAdapterProxy();
  readAccountedLayerAdapterProxy();
  readOperandTypeLayerAdapterProxy();

  return {};
};
