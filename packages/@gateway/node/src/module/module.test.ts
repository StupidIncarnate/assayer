import { createRequire, builtinModules, resolvePackageRoot, resolveModulePath, dynamicImport } from './module';
import * as pkgModule from 'module';
import { resolvePackageRoot as ourResolvePackageRoot } from './resolve-package-root/resolve-package-root';
import { resolveModulePath as ourResolveModulePath } from './resolve-module-path/resolve-module-path';
import { dynamicImport as ourDynamicImport } from './dynamic-import/dynamic-import';

describe('#gateway/node/module', () => {
  it('VALID: {createRequire} => is the same function module provides', () => {
    expect(createRequire).toBe(pkgModule.createRequire);
  });

  it('VALID: {builtinModules} => is the same array module provides', () => {
    expect(builtinModules).toBe(pkgModule.builtinModules);
  });

  it('VALID: {resolvePackageRoot} => is the same curated function this package exports directly', () => {
    expect(resolvePackageRoot).toBe(ourResolvePackageRoot);
  });

  it('VALID: {resolveModulePath} => is the same curated function this package exports directly', () => {
    expect(resolveModulePath).toBe(ourResolveModulePath);
  });

  it('VALID: {dynamicImport} => is the same curated function this package exports directly', () => {
    expect(dynamicImport).toBe(ourDynamicImport);
  });
});
