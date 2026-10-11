import { registerSpyOn } from '@legendscribe/lockdown-kit-testing/register-mock';
import type { RecordedCalls } from '@legendscribe/lockdown-kit-testing/register-mock';

// passthrough: the real microtask queue must still run. The spy only records what was queued.
export const queueMicrotaskProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'queueMicrotask', passthrough: true });

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
