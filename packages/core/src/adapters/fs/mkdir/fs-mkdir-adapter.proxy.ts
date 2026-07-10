/**
 * PURPOSE: Proxy for fsMkdirAdapter that mocks fs/promises mkdir
 *
 * USAGE:
 * const proxy = fsMkdirAdapterProxy();
 * proxy.succeeds();
 */
import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsMkdirAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getMkdirArgs: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: mkdir });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getMkdirArgs: (): readonly unknown[] => handle.mock.calls.at(-1) ?? [],
  };
};
