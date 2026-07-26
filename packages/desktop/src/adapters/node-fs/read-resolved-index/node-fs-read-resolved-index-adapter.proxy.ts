import { access, readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The resolved index always targets `.assayer/cache/resolved/<namespace>.json` — the pattern that
// tells this adapter's calls apart from every other proxy sharing the same access/readFile mocks (a
// manifest-exists check or a stub-index read, which use their own path shape).
const isResolvedIndexPath = (value: unknown): boolean =>
  typeof value === 'string' && value.includes('/.assayer/cache/resolved/');

export const nodeFsReadResolvedIndexAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  absent: () => void;
  readPath: () => unknown;
} => {
  const accessHandle = registerMock({ fn: access });
  const readHandle = registerMock({ fn: readFile });

  // Base behaviour is "absent" — the resolved index is optional, so an un-wired call reads as no
  // index (access rejects → adapter returns undefined). `returns` queues a one-shot present index.
  // Matched on the resolved-index path (not a blanket `calledWith([])`) because `access`/`readFile`
  // are shared across every proxy that mocks them — a manifest-exists check or a stub-index read
  // registers against the SAME underlying mocks when more than one proxy is live in one test.
  accessHandle
    .calledWith([isResolvedIndexPath])
    .rejects(new Error('ENOENT: no such file or directory'));
  readHandle.calledWith([isResolvedIndexPath]).resolves('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      accessHandle.onceFor([isResolvedIndexPath]).resolves(undefined);
      readHandle.onceFor([isResolvedIndexPath]).resolves(content);
    },
    absent: (): void => {
      accessHandle.onceFor([isResolvedIndexPath]).rejects(new Error('ENOENT: no such file or directory'));
    },
    readPath: (): unknown => readHandle.callsMatching([isResolvedIndexPath]).at(-1)?.[0],
  };
};
