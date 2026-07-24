import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const resolveSiblingCalleeBrokerProxy = (): {
  resolvesToSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
  resolvesToOutside: ({ fileName }: { fileName: string }) => void;
} => {
  // pathRelativeAdapter and the walk run REAL (deterministic path math, real parse). The module
  // resolver is REPLACED wholesale because resolution against a real filesystem is exactly what a unit
  // test cannot stage — the caller says where a specifier lands and what its source is instead.
  pathRelativeAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  const reads = fsReadFileSyncAdapterProxy();
  typescriptResolveModuleAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  resolveHandle.mockReturnValue({ resolved: false });

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a walkable sibling
    // needs. Queued once so multiple siblings are wired in the order their reaches resolve.
    resolvesToSibling: ({ fileName, source }: { fileName: string; source: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
      reads.returns({ content: source });
    },
    // Resolution lands somewhere but the file is a node_modules / outside-root file the broker skips as
    // non-local — its source is never read.
    resolvesToOutside: ({ fileName }: { fileName: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
  };
};
