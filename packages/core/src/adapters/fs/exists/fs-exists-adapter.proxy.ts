import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

export const fsExistsAdapterProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  fails: ({ path }: { path: string }) => void;
  callCount: () => FileCount;
} => {
  const handle = registerMock({ fn: access });

  return {
    succeeds: ({ path }: { path: string }): void => {
      handle.onceFor([path]).resolves(undefined);
    },
    fails: ({ path }: { path: string }): void => {
      handle.onceFor([path]).rejects(new Error('ENOENT: no such file or directory'));
    },
    callCount: (): FileCount => fileCountContract.parse(handle.callsMatching([]).length),
  };
};
