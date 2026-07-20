import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const composeCrossFilePredicatesBrokerProxy = (): {
  setupSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
  resolvesTo: ({ fileName }: { fileName: string }) => void;
} => {
  // pathRelativeAdapter, typescriptReadConfigAdapter and the walk run REAL (deterministic path math,
  // real tsconfig read, real parse). The module resolver is REPLACED wholesale because resolution
  // against a real filesystem is exactly what a unit test cannot stage — the caller says where a
  // specifier lands and what its source is instead.
  pathRelativeAdapterProxy();
  typescriptReadConfigAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  const reads = fsReadFileSyncAdapterProxy();
  typescriptResolveModuleAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  resolveHandle.mockReturnValue({ resolved: false });

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a composable branch
    // needs. Queued once so multiple siblings are wired in the order their branches compose.
    setupSibling: ({ fileName, source }: { fileName: string; source: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
      reads.returns({ content: source });
    },
    // Resolution lands somewhere but its source is never read — a node_modules / outside-root file the
    // compose skips as non-local.
    resolvesTo: ({ fileName }: { fileName: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
  };
};
