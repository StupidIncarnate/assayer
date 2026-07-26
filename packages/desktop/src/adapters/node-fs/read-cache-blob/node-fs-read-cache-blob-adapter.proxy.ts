import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// A cache blob read always targets `.assayer/cache/blobs/<hash>.json` — the pattern that tells this
// adapter's calls apart from every other proxy sharing the same readFile mock (a source read, or a
// stub-index/resolved-index/manifest read, none of which use this path shape).
const isBlobPath = (value: unknown): boolean =>
  typeof value === 'string' && value.includes('/.assayer/cache/blobs/');

export const nodeFsReadCacheBlobAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
  readPath: () => unknown;
} => {
  const handle = registerMock({ fn: readFile });

  // Matched on the blob path (not a blanket `calledWith([])`) because `readFile` is shared across
  // every proxy that mocks it — a source, manifest, resolved-index, or stub-index read registers
  // against the SAME underlying mock when more than one proxy is live in one test, and a blanket
  // default here would answer a call this proxy was never meant to serve.
  handle.calledWith([isBlobPath]).resolves('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.onceFor([isBlobPath]).resolves(content);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([isBlobPath]).rejects(error);
    },
    readPath: (): unknown => handle.callsMatching([isBlobPath]).at(-1)?.[0],
  };
};
