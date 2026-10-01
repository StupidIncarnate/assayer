import { ResolvedModuleStub } from './resolved-module.stub';

describe('ResolvedModuleStub', () => {
  it('VALID: {resolvedFileName} => a resolved module naming that file', () => {
    expect(ResolvedModuleStub({ resolvedFileName: '/repo/src/b/foo.ts' })).toStrictEqual({
      resolvedModule: { resolvedFileName: '/repo/src/b/foo.ts', extension: '.ts', isExternalLibraryImport: false },
    });
  });

  it('VALID: {resolvedFileName, extension, isExternalLibraryImport} => a package declaration file', () => {
    expect(
      ResolvedModuleStub({
        resolvedFileName: '/repo/node_modules/pkg/index.d.ts',
        extension: '.d.ts',
        isExternalLibraryImport: true,
      }),
    ).toStrictEqual({
      resolvedModule: {
        resolvedFileName: '/repo/node_modules/pkg/index.d.ts',
        extension: '.d.ts',
        isExternalLibraryImport: true,
      },
    });
  });

  it('EMPTY: {} => no resolved module, the shape TypeScript returns for a broken specifier', () => {
    expect(ResolvedModuleStub()).toStrictEqual({ resolvedModule: undefined });
  });
});
