import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  handle.mockResolvedValue('');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.mockResolvedValueOnce(content);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
