import { access, readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeFsReadStubIndexAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  absent: () => void;
  readPath: () => unknown;
} => {
  const accessHandle = registerMock({ fn: access });
  const readHandle = registerMock({ fn: readFile });

  // Base behaviour is "absent" — the stub index is optional, so an un-wired call reads as no index
  // (access rejects → adapter returns undefined). `returns` queues a one-shot present index.
  accessHandle.mockImplementation(async (): Promise<void> => Promise.reject(new Error('ENOENT: no such file or directory')));
  readHandle.mockResolvedValue('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      accessHandle.mockResolvedValueOnce(undefined);
      readHandle.mockResolvedValueOnce(content);
    },
    absent: (): void => {
      accessHandle.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    },
    readPath: (): unknown => readHandle.mock.calls.at(-1)?.[0],
  };
};
