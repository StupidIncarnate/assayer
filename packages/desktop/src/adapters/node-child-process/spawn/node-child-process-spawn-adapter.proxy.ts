import { spawn } from 'node:child_process';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const nodeChildProcessSpawnAdapterProxy = (): {
  getLastCall: () => readonly unknown[] | undefined;
  getStderrWrites: () => unknown[];
  failsToSpawn: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: spawn });
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);
  const state: { error: Error | undefined } = { error: undefined };

  handle.mockReturnValue({
    on: (event: string, listener: (error: Error) => void): void => {
      if (event === 'error' && state.error !== undefined) {
        listener(state.error);
      }
    },
    unref: (): void => undefined,
  } as ReturnType<typeof spawn>);

  return {
    getLastCall: (): readonly unknown[] | undefined => handle.mock.calls.at(-1),
    getStderrWrites: (): unknown[] => stderrSpy.mock.calls.map((call) => String(call[0])),
    failsToSpawn: ({ error }: { error: Error }): void => {
      state.error = error;
    },
  };
};
