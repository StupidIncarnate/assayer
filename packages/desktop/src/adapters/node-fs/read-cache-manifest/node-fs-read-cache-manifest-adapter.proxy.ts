import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeFsReadCacheManifestAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
  readPath: () => unknown;
  wasCalled: () => boolean;
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
    wasCalled: (): boolean => handle.mock.calls.length > 0,
  };
};
