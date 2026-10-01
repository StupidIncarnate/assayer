/**
 * PURPOSE: Proxy for fsRmAdapter that mocks fs/promises rm
 *
 * USAGE:
 * const proxy = fsRmAdapterProxy();
 * proxy.succeeds();
 */
import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const fsRmAdapterProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  denied: ({ path }: { path: string }) => void;
  getRmArgs: ({ path }: { path: string }) => readonly unknown[];
} => {
  const handle = registerMock({ fn: rm });

  return {
    succeeds: ({ path }: { path: string }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    // Answers for the asked-for path only. A caller that removes several paths gets the one it
    // named, never whichever rm happened to run last.
    getRmArgs: ({ path }: { path: string }): readonly unknown[] =>
      handle.callsMatching([path]).at(-1) ?? [],
  };
};
