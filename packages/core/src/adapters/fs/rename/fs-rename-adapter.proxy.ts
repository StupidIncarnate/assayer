/**
 * PURPOSE: Proxy for fsRenameAdapter that mocks fs/promises rename
 *
 * USAGE:
 * const proxy = fsRenameAdapterProxy();
 * proxy.succeeds();
 */
import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRenameAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getRenameArgs: ({ from }: { from: string }) => readonly unknown[];
} => {
  const handle = registerMock({ fn: rename });

  handle.calledWith([]).resolves(undefined);

  return {
    succeeds: (): void => {
      handle.onceFor([]).resolves(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([]).rejects(error);
    },
    // Addressed on the SOURCE path, the first argument, so the destination this returns is the one
    // the named rename actually moved the file to, never whichever rename happened to run last.
    getRenameArgs: ({ from }: { from: string }): readonly unknown[] =>
      handle.callsMatching([from]).at(-1) ?? [],
  };
};
