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
  });
};
