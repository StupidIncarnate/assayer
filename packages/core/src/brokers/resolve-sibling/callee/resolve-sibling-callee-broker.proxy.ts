import { registerMock } from '@dungeonmaster/testing/register-mock';

import { importSpecifierResolveBroker } from '../../import-specifier/resolve/import-specifier-resolve-broker';
import { importSpecifierResolveBrokerProxy } from '../../import-specifier/resolve/import-specifier-resolve-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const resolveSiblingCalleeBrokerProxy = (): {
  // `specifier` is optional so a test resolving a single sibling can answer the next resolve call.
  // A test resolving MORE THAN ONE sibling in the same run (two guards each importing a different
  // predicate, or two array params each mapping a different callee) must pass the exact import
  // specifier the caller source spells (e.g. './over'), so each resolve answers the call that actually
  // named it instead of whichever resolve happens to run first.
  resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }) => void;
  resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier?: string }) => void;
} => {
  // `relative` from the path gateway and the walk run REAL (deterministic path math, real parse). The
  // module resolver is REPLACED wholesale because resolution against a real filesystem is exactly what
  // a unit test cannot stage — the caller says where a specifier lands and what its source is instead.
  // Nothing is staged for the sibling read until resolvesToSibling names the exact resolved file.
  const reads = readFileSyncProxy();
  importSpecifierResolveBrokerProxy();

  const resolveHandle = registerMock({ fn: importSpecifierResolveBroker });
  // The fallback answer for a specifier no setup method named; the setup methods below stage a
  // one-shot answer per specifier on top of it.
  resolveHandle.calledWith([]).returns({ resolved: false });

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a walkable sibling
    // needs. The read is always matched on the exact resolved `fileName`, which every caller here knows
    // regardless of whether it also names a specifier.
    resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }): void => {
      resolveHandle
        .onceFor(specifier === undefined ? [] : [{ specifier }])
        .returns({ resolved: true, fileName: FilePathStub({ value: fileName }) });
      reads.returns({ path: fileName, contents: source });
    },
    // Resolution lands somewhere but the file is a node_modules / outside-root file the broker skips as
    // non-local — its source is never read.
    resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier?: string }): void => {
      resolveHandle
        .onceFor(specifier === undefined ? [] : [{ specifier }])
        .returns({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
  };
};
