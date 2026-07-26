import { access } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The manifest check always targets `.assayer/cache/manifest.json` — the pattern that tells this
// adapter's calls apart from every other proxy sharing the same access mock (a stub-index or
// resolved-index existence check, which use their own namespaced path shape).
const isManifestPath = (value: unknown): boolean =>
  typeof value === 'string' && value.endsWith('/.assayer/cache/manifest.json');

export const nodeFsCacheManifestExistsAdapterProxy = (): {
  exists: () => void;
  missing: () => void;
  checkedPath: () => unknown;
} => {
  const handle = registerMock({ fn: access });

  // Matched on the manifest path (not a blanket `calledWith([])`) because `access` is shared across
  // every proxy that mocks it — a resolved-index or stub-index existence check registers against the
  // SAME underlying mock when both proxies are live in one test, and a blanket default here would win
  // or lose that race by registration order instead of by which path was actually checked.
  handle.calledWith([isManifestPath]).resolves(undefined);

  return {
    exists: (): void => {
      handle.onceFor([isManifestPath]).resolves(undefined);
    },
    missing: (): void => {
      handle.onceFor([isManifestPath]).rejects(new Error('ENOENT: no such file or directory'));
    },
    checkedPath: (): unknown => handle.callsMatching([isManifestPath]).at(-1)?.[0],
  };
};
