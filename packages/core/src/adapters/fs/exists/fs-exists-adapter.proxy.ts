import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

export const fsExistsAdapterProxy = (): {
  succeeds: () => void;
  fails: () => void;
  callCount: () => FileCount;
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
    callCount: (): FileCount => fileCountContract.parse(handle.mock.calls.length),
  };
};
