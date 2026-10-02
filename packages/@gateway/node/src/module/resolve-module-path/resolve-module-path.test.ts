import { resolveModulePath } from './resolve-module-path';

describe('resolveModulePath', () => {
  it('VALID: {specifier: an installed package file, fromPath: this test file} => returns its real absolute path', () => {
    const result = resolveModulePath({ specifier: 'typescript/package.json', fromPath: __filename });

    // Derived from a separate resolution, never a hardcoded path: this file ships as source into
    // every consumer repo, where the package sits at a different absolute path.
    expect(result).toBe(require.resolve('typescript/package.json'));
  });

  it('ERROR: {specifier: a package that is not installed} => throws Node own module-not-found error', () => {
    expect(() =>
      resolveModulePath({ specifier: 'totally-not-a-real-package-xyz123', fromPath: __filename }),
    ).toThrow(/^Cannot find module 'totally-not-a-real-package-xyz123'/u);
  });
});
