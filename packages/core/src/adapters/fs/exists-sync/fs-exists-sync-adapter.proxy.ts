import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  exists: () => void;
  missing: () => void;
} => {
  const handle = registerMock({ fn: existsSync });

  handle.calledWith([]).returns(false);

  return {
    exists: (): void => {
      handle.onceFor([]).returns(true);
    },
    missing: (): void => {
      handle.onceFor([]).returns(false);
    },
  };
};
