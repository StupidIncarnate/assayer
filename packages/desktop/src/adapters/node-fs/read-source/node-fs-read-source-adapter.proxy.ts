import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeFsReadSourceAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  missing: () => void;
} => {
  const handle = registerMock({ fn: readFile });

  // Default: a trivially parseable source, so a broker that reads-then-walks succeeds without a test
  // wiring anything.
  handle.mockResolvedValue('export const x = 1;\n');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.mockResolvedValueOnce(content);
    },
    missing: (): void => {
      handle.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    },
  };
};
