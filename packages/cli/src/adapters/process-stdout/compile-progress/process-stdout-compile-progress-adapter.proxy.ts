import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const processStdoutCompileProgressAdapterProxy = (): {
  getWrites: () => unknown[];
  enableTty: () => void;
} => {
  process.stdout.isTTY = false;

  const writeSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  writeSpy.calledWith([]).implement(() => true);

  return {
    getWrites: (): unknown[] => writeSpy.callsMatching([]).map((call) => String(call[0])),
    enableTty: (): void => {
      process.stdout.isTTY = true;
    },
  };
};
