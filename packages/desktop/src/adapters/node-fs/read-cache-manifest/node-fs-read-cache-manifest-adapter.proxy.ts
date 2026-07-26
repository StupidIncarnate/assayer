import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The cache manifest always targets `.assayer/cache/manifest.json` — the pattern that tells this
// adapter's calls apart from every other proxy sharing the same readFile mock (a source, blob,
// resolved-index, or stub-index read, which all use their own path shape).
const isManifestPath = (value: unknown): boolean =>
  typeof value === 'string' && value.endsWith('/.assayer/cache/manifest.json');

export const nodeFsReadCacheManifestAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  throws: ({ error }: { error: Error }) => void;
  readPath: () => unknown;
  wasCalled: () => boolean;
} => {
  const handle = registerMock({ fn: readFile });

  // Matched on the manifest path (not a blanket `calledWith([])`) because `readFile` is shared across
  // every proxy that mocks it — a blanket default here would answer a call this proxy was never meant
  // to serve, the same shared-queue shape a source read and a blob read used to collide on.
  handle.calledWith([isManifestPath]).resolves('{}');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.onceFor([isManifestPath]).resolves(content);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([isManifestPath]).rejects(error);
    },
    readPath: (): unknown => handle.callsMatching([isManifestPath]).at(-1)?.[0],
    wasCalled: (): boolean => handle.callsMatching([isManifestPath]).length > 0,
  };
};
