/**
 * PURPOSE: Proxy for fsRenameAdapter that mocks fs/promises rename
 *
 * USAGE:
 * const proxy = fsRenameAdapterProxy();
 * proxy.succeeds();
 */
import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const fsRenameAdapterProxy = (): {
  succeeds: ({ from }: { from: string }) => void;
  denied: ({ from }: { from: string }) => void;
  getRenameArgs: ({ from }: { from: string }) => readonly unknown[];
} => {
  const handle = registerMock({ fn: rename });

  return {
    succeeds: ({ from }: { from: string }): void => {
      handle.calledWith([from]).resolves(undefined);
    },
    denied: ({ from }: { from: string }): void => {
      handle.calledWith([from]).rejects(FsErrorStub({ code: 'EACCES', path: from }));
    },
    // Addressed on the SOURCE path, the first argument, so the destination this returns is the one
    // the named rename actually moved the file to, never whichever rename happened to run last.
    getRenameArgs: ({ from }: { from: string }): readonly unknown[] =>
      handle.callsMatching([from]).at(-1) ?? [],
  };
};
