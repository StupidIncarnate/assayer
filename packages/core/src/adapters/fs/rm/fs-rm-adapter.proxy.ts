/**
 * PURPOSE: Proxy for fsRmAdapter that mocks fs/promises rm
 *
 * USAGE:
 * const proxy = fsRmAdapterProxy();
 * proxy.succeeds();
 */
import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRmAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getRmArgs: ({ path }: { path: string }) => readonly unknown[];
} => {
  const handle = registerMock({ fn: rm });

  handle.calledWith([]).resolves(undefined);

  return {
    succeeds: (): void => {
      handle.onceFor([]).resolves(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([]).rejects(error);
    },
    // Answers for the asked-for path only. A caller that removes several paths gets the one it
    // named, never whichever rm happened to run last.
    getRmArgs: ({ path }: { path: string }): readonly unknown[] =>
      handle.callsMatching([path]).at(-1) ?? [],
  };
};
