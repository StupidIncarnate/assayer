import { spawn } from 'node:child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeChildProcessSpawnAdapterProxy = (): {
  getLastCall: () => readonly unknown[] | undefined;
} => {
  const handle = registerMock({ fn: spawn });
  handle.mockReturnValue({ unref: (): void => undefined } as ReturnType<typeof spawn>);

  return {
    getLastCall: (): readonly unknown[] | undefined => handle.mock.calls.at(-1),
  };
};
