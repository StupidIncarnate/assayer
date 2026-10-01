import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const fsReadFileAdapterProxy = (): {
  returns: ({ path, content }: { path: string; content: string }) => void;
  missing: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ path, content }: { path: string; content: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(content);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
  };
};
