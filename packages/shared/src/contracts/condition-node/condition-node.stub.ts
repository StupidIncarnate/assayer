import type { StubArgument } from '@dungeonmaster/shared/@types';

import { conditionNodeContract } from './condition-node-contract';
import type { ConditionNode } from './condition-node-contract';

export const ConditionNodeStub = ({ ...props }: StubArgument<ConditionNode> = {}): ConditionNode =>
  conditionNodeContract.parse({
    kind: 'leaf',
    id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf:0',
    operandParamName: 'value',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
    ...props,
  });
