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
  getRmArgs: () => readonly unknown[];
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
    getRmArgs: (): readonly unknown[] => handle.callsMatching([]).at(-1) ?? [],
  };
};
