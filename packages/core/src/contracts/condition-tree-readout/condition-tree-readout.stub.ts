import type { StubArgument } from '@dungeonmaster/shared/@types';

import { conditionTreeReadoutContract } from './condition-tree-readout-contract';
import type { ConditionTreeReadout } from './condition-tree-readout-contract';

export const ConditionTreeReadoutStub = ({ ...props }: StubArgument<ConditionTreeReadout> = {}): ConditionTreeReadout =>
  conditionTreeReadoutContract.parse({
    condition: {
      kind: 'leaf',
      id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
      operandParamName: 'score',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    },
    sites: [
      {
        id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
        kind: 'cond',
        start: 64,
        end: 73,
      },
    ],
    ...props,
  });
