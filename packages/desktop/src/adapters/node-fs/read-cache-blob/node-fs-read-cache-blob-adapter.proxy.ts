import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeFsReadCacheBlobAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
  readPath: () => unknown;
} => {
  const handle = registerMock({ fn: readFile });

  handle.mockResolvedValue('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.mockResolvedValueOnce(content);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    readPath: (): unknown => handle.mock.calls.at(-1)?.[0],
  };
};
