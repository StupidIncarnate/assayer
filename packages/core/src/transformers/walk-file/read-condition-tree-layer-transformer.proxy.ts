import { readConditionLayerTransformerProxy } from './read-condition-layer-transformer.proxy';
import { readConstOperandLayerTransformerProxy } from './read-const-operand-layer-transformer.proxy';
import { readEnvOperandLayerTransformerProxy } from './read-env-operand-layer-transformer.proxy';
import { readOperandTypeLayerTransformerProxy } from './read-operand-type-layer-transformer.proxy';

export const readConditionTreeLayerTransformerProxy = (): Record<PropertyKey, never> => {
  readConditionLayerTransformerProxy();
  readConstOperandLayerTransformerProxy();
  readEnvOperandLayerTransformerProxy();
  readOperandTypeLayerTransformerProxy();

  return {};
};
