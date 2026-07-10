/**
 * PURPOSE: Proxy for fsReaddirAdapter that mocks fs/promises readdir
 *
 * USAGE:
 * const proxy = fsReaddirAdapterProxy();
 * proxy.returns({ entries: [{ name: 'index.ts', isDirectory: false }] });
 */

import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReaddirAdapterProxy = (): {
  returns: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      const direntLikes = entries.map((entry) => ({
        name: entry.name,
        isDirectory: (): boolean => entry.isDirectory,
      }));
      handle.mockResolvedValueOnce(direntLikes as unknown as Awaited<ReturnType<typeof readdir>>);
    },
  };
};
