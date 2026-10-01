import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  exists: ({ path }: { path: string }) => void;
  missing: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: existsSync });

  return {
    exists: ({ path }: { path: string }): void => {
      handle.onceFor([path]).returns(true);
    },
    missing: ({ path }: { path: string }): void => {
      handle.onceFor([path]).returns(false);
    },
  };
};
