import type { StubArgument } from '@dungeonmaster/shared/@types';

import { conditionLeafContract } from './condition-leaf-contract';
import type { ConditionLeaf } from './condition-leaf-contract';

export const ConditionLeafStub = ({ ...props }: StubArgument<ConditionLeaf> = {}): ConditionLeaf =>
  conditionLeafContract.parse({
    kind: 'leaf',
    id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
    operandParamName: 'value',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
    ...props,
  });
