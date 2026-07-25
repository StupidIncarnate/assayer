import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  exists: () => void;
  missing: () => void;
} => {
  const handle = registerMock({ fn: existsSync });

  handle.mockReturnValue(false);

  return {
    exists: (): void => {
      handle.mockReturnValueOnce(true);
    },
    missing: (): void => {
      handle.mockReturnValueOnce(false);
    },
  };
};
