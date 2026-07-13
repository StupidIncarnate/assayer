import { access } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeFsCacheManifestExistsAdapterProxy = (): {
  exists: () => void;
  missing: () => void;
  checkedPath: () => unknown;
} => {
  const handle = registerMock({ fn: access });

  handle.mockResolvedValue(undefined);

  return {
    exists: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    missing: (): void => {
      handle.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    },
    checkedPath: (): unknown => handle.mock.calls.at(-1)?.[0],
  };
};
