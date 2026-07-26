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

  handle.calledWith([]).resolves(undefined);

  return {
    succeeds: (): void => {
      handle.onceFor([]).resolves(undefined);
    },
    fails: (): void => {
      handle.onceFor([]).rejects(new Error('ENOENT: no such file or directory'));
    },
    callCount: (): FileCount => fileCountContract.parse(handle.callsMatching([]).length),
  };
};
