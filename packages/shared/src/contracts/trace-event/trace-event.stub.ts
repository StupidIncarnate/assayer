import type { StubArgument } from '@dungeonmaster/shared/@types';

import { traceEventContract } from './trace-event-contract';
import type { TraceEvent } from './trace-event-contract';

export const TraceEventStub = ({ ...props }: StubArgument<TraceEvent> = {}): TraceEvent =>
  traceEventContract.parse({
    id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf.0',
    kind: 'cond',
    outcome: true,
    valueText: 'true',
    ...props,
  });
