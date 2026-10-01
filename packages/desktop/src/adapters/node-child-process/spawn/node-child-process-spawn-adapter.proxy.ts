import { spawn } from 'node:child_process';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { stderr } from '#gateway/node/process';

export const nodeChildProcessSpawnAdapterProxy = (): {
  getStderrWrites: () => unknown[];
  failsToSpawn: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: spawn });
  const stderrSpy = registerSpyOn({ object: stderr, method: 'write' });
  stderrSpy.calledWith([]).implement(() => true);
  const state: { error: Error | undefined } = { error: undefined };

  // Every spawn call gets the same fake ChildProcess back regardless of command/args, since the
  // adapter is called once per launch with nothing this proxy needs to tell apart.
  handle.calledWith([]).returns({
    on: (event: string, listener: (error: Error) => void): void => {
      if (event === 'error' && state.error !== undefined) {
        listener(state.error);
      }
    },
    unref: (): void => undefined,
  } as ReturnType<typeof spawn>);

  return {
    // Every write regardless of what else write() was called with (encoding, callback) — a real
    // collector, not a narrowed one.
    getStderrWrites: (): unknown[] => stderrSpy.callsMatching([]).map((call) => String(call[0])),
    failsToSpawn: ({ error }: { error: Error }): void => {
      state.error = error;
    },
  };
};
