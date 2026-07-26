import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const resolveSiblingCalleeBrokerProxy = (): {
  // `specifier` is optional so a test resolving a single sibling keeps the old "next call" shorthand.
  // A test resolving MORE THAN ONE sibling in the same run (two guards each importing a different
  // predicate, or two array params each mapping a different callee) must pass the exact import
  // specifier the caller source spells (e.g. './over'), so each resolve answers the call that actually
  // named it instead of whichever resolve happens to run first.
  resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }) => void;
  resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier?: string }) => void;
} => {
  // pathRelativeAdapter and the walk run REAL (deterministic path math, real parse). The module
  // resolver is REPLACED wholesale because resolution against a real filesystem is exactly what a unit
  // test cannot stage — the caller says where a specifier lands and what its source is instead.
  pathRelativeAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  const reads = fsReadFileSyncAdapterProxy();
  typescriptResolveModuleAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  // Stays on the legacy per-adapter-routed fallback so the proxy constructor stays free of the
  // argument-matching side effects the setup methods below add per test.
  resolveHandle.calledWith([]).returns({ resolved: false });

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a walkable sibling
    // needs. The read is always matched on the exact resolved `fileName`, which every caller here knows
    // regardless of whether it also names a specifier.
    resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }): void => {
      resolveHandle
        .onceFor(specifier === undefined ? [] : [{ specifier }])
        .returns({ resolved: true, fileName: FilePathStub({ value: fileName }) });
      reads.returns({ content: source, path: fileName });
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
