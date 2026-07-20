import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileSyncAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  handle.mockReturnValue('');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.mockReturnValueOnce(content);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
