import { spawn } from 'node:child_process';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { stderr } from '#gateway/node/process';

export const nodeChildProcessSpawnAdapterProxy = (): {
  getStderrWrites: () => unknown[];
  spawns: ({ command, args }: { command: string; args: readonly string[] }) => void;
  failsToSpawn: ({ command, args, error }: { command: string; args: readonly string[]; error: Error }) => void;
} => {
  const handle = registerMock({ fn: spawn });
  const stderrSpy = registerSpyOn({ object: stderr, method: 'write' });
  stderrSpy.calledWith([]).implement(() => true);

  return {
    // Every write regardless of what else write() was called with (encoding, callback) — a real
    // collector, not a narrowed one.
    getStderrWrites: (): unknown[] => stderrSpy.callsMatching([]).map((call) => String(call[0])),
    // A launch the child accepts: it never emits `error`.
    spawns: ({ command, args }): void => {
      handle.calledWith([command, [...args]]).returns({
        on: (_event: string, _listener: (error: Error) => void): void => undefined,
        unref: (): void => undefined,
      } as ReturnType<typeof spawn>);
    },
    // A launch the child rejects: it emits `error` as soon as a listener is attached.
    failsToSpawn: ({ command, args, error }): void => {
      handle.calledWith([command, [...args]]).returns({
        on: (event: string, listener: (error: Error) => void): void => {
          if (event === 'error') {
            listener(error);
          }
        },
        unref: (): void => undefined,
      } as ReturnType<typeof spawn>);
    },
  };
};
