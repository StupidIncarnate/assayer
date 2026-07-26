import { registerMock } from '@dungeonmaster/testing/register-mock';

import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const resolveSpecifierLayerBrokerProxy = (): {
  // `specifier` is optional so a test resolving a single specifier keeps the old "next call" shorthand.
  // A test that follows a re-export barrel resolves MORE THAN ONE specifier in the same run (the barrel
  // itself, then the name it forwards to) and must pass the exact specifier the recursive call names, so
  // each resolve answers the call that actually asked for it instead of whichever resolve runs first.
  resolvesLocal: ({ fileName, specifier }: { fileName: string; specifier?: string }) => void;
  resolvesLocalOnce: ({ fileName, specifier }: { fileName: string; specifier?: string }) => void;
  resolvesUnresolved: () => void;
} => {
  // pathRelativeAdapter runs REAL (deterministic path math). The module resolver is REPLACED wholesale
  // because resolution against a real filesystem is exactly what a unit test cannot stage — the caller
  // says where a specifier lands instead.
  typescriptResolveModuleAdapterProxy();
  pathRelativeAdapterProxy();

  const resolveHandle = registerMock({ fn: typescriptResolveModuleAdapter });
  resolveHandle.calledWith([]).returns({ resolved: false });

  return {
    resolvesLocal: ({ fileName, specifier }: { fileName: string; specifier?: string }): void => {
      resolveHandle
        .calledWith(specifier === undefined ? [] : [{ specifier }])
        .returns({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
    resolvesLocalOnce: ({ fileName, specifier }: { fileName: string; specifier?: string }): void => {
      resolveHandle
        .onceFor(specifier === undefined ? [] : [{ specifier }])
        .returns({ resolved: true, fileName: FilePathStub({ value: fileName }) });
    },
    resolvesUnresolved: (): void => {
      resolveHandle.calledWith([]).returns({ resolved: false });
    },
  };
};
