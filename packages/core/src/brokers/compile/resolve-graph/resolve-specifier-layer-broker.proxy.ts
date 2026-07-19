import { registerMock } from '@dungeonmaster/testing/register-mock';

import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const resolveSpecifierLayerBrokerProxy = (): {
  resolvesLocal: ({ fileName }: { fileName: string }) => void;
  resolvesLocalOnce: ({ fileName }: { fileName: string }) => void;
  resolvesUnresolved: () => void;
} => {
  // pathRelativeAdapter runs REAL (deterministic path math). The module resolver is REPLACED wholesale
  // because resolution against a real filesystem is exactly what a unit test cannot stage — the caller
  // says where a specifier lands instead.
  typescriptResolveModuleAdapterProxy();
  pathRelativeAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  resolveHandle.mockReturnValue({ resolved: false });

  return {
    resolvesLocal: ({ fileName }: { fileName: string }): void => {
      resolveHandle.mockReturnValue({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
    resolvesLocalOnce: ({ fileName }: { fileName: string }): void => {
      resolveHandle.mockReturnValueOnce({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
    resolvesUnresolved: (): void => {
      resolveHandle.mockReturnValue({ resolved: false });
    },
  };
};
