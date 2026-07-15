import { runCLI } from '@jest/core';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const jestRunCliAdapterProxy = (): {
  succeeds: () => void;
  fails: () => void;
  lastConfig: () => unknown;
} => {
  const handle = registerMock({ fn: runCLI });
  handle.mockResolvedValue({ results: { success: true } });

  return {
    succeeds: (): void => { handle.mockResolvedValueOnce({ results: { success: true } }); },
    fails: (): void => { handle.mockResolvedValueOnce({ results: { success: false } }); },
    lastConfig: (): unknown => {
      const call = handle.mock.calls.at(-1);
      const argv = call?.[0];

      return typeof argv === 'object' && argv !== null && 'config' in argv ? argv.config : undefined;
    },
  };
};
