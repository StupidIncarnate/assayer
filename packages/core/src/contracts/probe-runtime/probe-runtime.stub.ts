import { traceEventContract } from '@assayer/shared/contracts';

import { probeRuntimeContract } from './probe-runtime-contract';
import type { ProbeRuntime } from './probe-runtime-contract';

export const ProbeRuntimeStub = (): ProbeRuntime => {
  const events: ReturnType<typeof traceEventContract.parse>[] = [];

  return probeRuntimeContract.parse({
    events,
    reset: (): void => {
      events.length = 0;
    },
    c: (id: string, value: unknown): unknown => {
      events.push(traceEventContract.parse({ id, kind: 'cond', outcome: Boolean(value), valueText: String(value) }));

      return value;
    },
    x: (id: string, value: unknown): unknown => {
      events.push(traceEventContract.parse({ id, kind: 'exit', valueText: String(value) }));

      return value;
    },
    oc: (thenId: string, elseId: string, receiver: unknown, access: (receiver: unknown) => unknown): unknown => {
      if (receiver === undefined || receiver === null) {
        events.push(traceEventContract.parse({ id: elseId, kind: 'exit', valueText: String(undefined) }));

        return undefined;
      }

      const value = access(receiver);
      events.push(traceEventContract.parse({ id: thenId, kind: 'exit', valueText: String(value) }));

      return value;
    },
  });
};
