import { access, readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The stub index always targets `.assayer/cache/stubs/<namespace>.json` — the pattern that tells this
// adapter's calls apart from every other proxy sharing the same access/readFile mocks (a
// manifest-exists check or a resolved-index read, which use their own path shape).
const isStubIndexPath = (value: unknown): boolean =>
  typeof value === 'string' && value.includes('/.assayer/cache/stubs/');

export const nodeFsReadStubIndexAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  absent: () => void;
  readPath: () => unknown;
} => {
  const accessHandle = registerMock({ fn: access });
  const readHandle = registerMock({ fn: readFile });

  // Base behaviour is "absent" — the stub index is optional, so an un-wired call reads as no index
  // (access rejects → adapter returns undefined). `returns` queues a one-shot present index. Matched
  // on the stub-index path (not a blanket `calledWith([])`) because `access`/`readFile` are shared
  // across every proxy that mocks them — a manifest-exists check or a resolved-index read registers
  // against the SAME underlying mocks when more than one proxy is live in one test.
  accessHandle.calledWith([isStubIndexPath]).rejects(new Error('ENOENT: no such file or directory'));
  readHandle.calledWith([isStubIndexPath]).resolves('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      accessHandle.onceFor([isStubIndexPath]).resolves(undefined);
      readHandle.onceFor([isStubIndexPath]).resolves(content);
    },
    absent: (): void => {
      accessHandle.onceFor([isStubIndexPath]).rejects(new Error('ENOENT: no such file or directory'));
    },
    readPath: (): unknown => readHandle.callsMatching([isStubIndexPath]).at(-1)?.[0],
  };
};
