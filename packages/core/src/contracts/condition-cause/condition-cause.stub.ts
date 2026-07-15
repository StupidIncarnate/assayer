import type { StubArgument } from '@dungeonmaster/shared/@types';

import { conditionCauseContract } from './condition-cause-contract';
import type { ConditionCause } from './condition-cause-contract';

export const ConditionCauseStub = ({ ...props }: StubArgument<ConditionCause> = {}): ConditionCause =>
  conditionCauseContract.parse({
    requirements: [
      {
        leaf: {
          kind: 'leaf',
          id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
          operandParamName: 'value',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        want: true,
      },
    ],
    ...props,
  });
