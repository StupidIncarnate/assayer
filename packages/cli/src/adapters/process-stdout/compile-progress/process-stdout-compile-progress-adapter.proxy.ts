import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { stdout } from '#gateway/node/process';

export const processStdoutCompileProgressAdapterProxy = (): {
  getWrites: () => unknown[];
  enableTty: () => void;
} => {
  stdout.isTTY = false;

  const writeSpy = registerSpyOn({ object: stdout, method: 'write' });
  writeSpy.calledWith([]).implement(() => true);

  return {
    getWrites: (): unknown[] => writeSpy.callsMatching([]).map((call) => String(call[0])),
    enableTty: (): void => {
      stdout.isTTY = true;
    },
  };
};
