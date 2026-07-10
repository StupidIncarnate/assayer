import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
} => {
  const handle = registerMock({ fn: writeFile });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    getWrittenPath: (): unknown => handle.mock.calls.at(-1)?.[0],
    getWrittenContent: (): unknown => handle.mock.calls.at(-1)?.[1],
  };
};
