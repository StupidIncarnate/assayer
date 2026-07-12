import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const processStdoutCompileProgressAdapterProxy = (): {
  getWrites: () => unknown[];
  enableTty: () => void;
} => {
  process.stdout.isTTY = false;

  const writeSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  writeSpy.mockImplementation(() => true);

  return {
    getWrites: (): unknown[] => writeSpy.mock.calls.map((call) => String(call[0])),
    enableTty: (): void => {
      process.stdout.isTTY = true;
    },
  };
};
