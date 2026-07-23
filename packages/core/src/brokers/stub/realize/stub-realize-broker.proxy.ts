import { registerMock } from '@dungeonmaster/testing/register-mock';

import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const stubRealizeBrokerProxy = (): {
  setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }) => void;
} => {
  // The walk, tsconfig read, path math, hash, and analyze run REAL — the same real pipeline compose
  // uses. Only module resolution is REPLACED wholesale, because resolving a cross-file type against a
  // real filesystem is exactly what a unit test cannot stage; the caller says where a specifier lands
  // and what the definition file's source is instead.
  analyzeFileBrokerProxy();
  cryptoSha256AdapterProxy();
  pathRelativeAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  typescriptReadConfigAdapterProxy();
  const reads = fsReadFileSyncAdapterProxy();
  typescriptResolveModuleAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  resolveHandle.mockReturnValue({ resolved: false });

  return {
    // A cross-file type's definition both RESOLVES to `fileName` and READS back `source` — the pair a
    // cross-file object read needs. Queued once so several type definitions wire in read order.
    setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
      reads.returns({ content: source });
    },
  };
};
