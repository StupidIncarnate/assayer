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
  getRenameArgs: () => readonly unknown[];
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
    getRenameArgs: (): readonly unknown[] => handle.callsMatching([]).at(-1) ?? [],
  };
};
