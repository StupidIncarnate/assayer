import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileSyncAdapterProxy = (): {
  returns: ({ content, path }: { content: string; path: string }) => void;
  throws: ({ error, path }: { error: Error; path: string }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    returns: ({ content, path }: { content: string; path: string }): void => {
      handle.onceFor([path]).returns(content);
    },
    throws: ({ error, path }: { error: Error; path: string }): void => {
      handle.onceFor([path]).throws(error);
    },
  };
};
