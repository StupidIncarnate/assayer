import { registerMock } from '@dungeonmaster/testing/register-mock';

import { importSpecifierResolveBroker } from '../../import-specifier/resolve/import-specifier-resolve-broker';
import { importSpecifierResolveBrokerProxy } from '../../import-specifier/resolve/import-specifier-resolve-broker.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const resolveSiblingCalleeBrokerProxy = (): {
  // Every scenario names the exact import specifier the caller source spells (e.g. './over'), so each
  // resolve answers the call that actually named it. A specifier no scenario named reaches an unstaged
  // call, which throws.
  resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
  resolvesToNothing: ({ specifier }: { specifier: string }) => void;
} => {
  // `relative` from the path gateway and the walk run REAL (deterministic path math, real parse). The
  // module resolver is REPLACED wholesale because resolution against a real filesystem is exactly what
  // a unit test cannot stage — the caller says where a specifier lands and what its source is instead.
  // Nothing is staged for the sibling read until resolvesToSibling names the exact resolved file.
  const reads = readFileSyncProxy();
  importSpecifierResolveBrokerProxy();

  const resolveHandle = registerMock({ fn: importSpecifierResolveBroker });

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a walkable sibling
    // needs. The read is matched on the exact resolved `fileName`.
    resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      resolveHandle
        .onceFor([{ specifier }])
        .returns({ resolved: true, fileName: fileName });
      reads.returns({ path: fileName, contents: source });
    },
    // Resolution lands somewhere but the file is a node_modules / outside-root file the broker skips as
    // non-local — its source is never read.
    resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier: string }): void => {
      resolveHandle
        .onceFor([{ specifier }])
        .returns({ resolved: true, fileName: fileName });
    },
    // The specifier points at nothing: a broken import.
    resolvesToNothing: ({ specifier }: { specifier: string }): void => {
      resolveHandle.onceFor([{ specifier }]).returns({ resolved: false });
    },
  };
};
