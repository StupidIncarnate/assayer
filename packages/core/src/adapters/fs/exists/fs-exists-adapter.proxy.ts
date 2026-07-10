import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsAdapterProxy = (): {
  succeeds: () => void;
  fails: () => void;
} => {
  const handle = registerMock({ fn: access });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    fails: (): void => {
      handle.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    },
  };
};
