import { desugarSwitchLayerTransformerProxy } from './desugar-switch-layer-transformer.proxy';
import { handleBlockLayerTransformerProxy } from './handle-block-layer-transformer.proxy';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';
import { readAccountedLayerTransformerProxy } from './read-accounted-layer-transformer.proxy';
import { readConstOperandLayerTransformerProxy } from './read-const-operand-layer-transformer.proxy';
import { readEnvOperandLayerTransformerProxy } from './read-env-operand-layer-transformer.proxy';
import { readOperandTypeLayerTransformerProxy } from './read-operand-type-layer-transformer.proxy';

export const handleSwitchLayerTransformerProxy = (): Record<PropertyKey, never> => {
  desugarSwitchLayerTransformerProxy();
  handleBlockLayerTransformerProxy();
  handlerResultLayerTransformerProxy();
  readAccountedLayerTransformerProxy();
  readConstOperandLayerTransformerProxy();
  readEnvOperandLayerTransformerProxy();
  readOperandTypeLayerTransformerProxy();

  return {};
};
