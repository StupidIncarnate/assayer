import { ModuleResolutionKind } from '../bundled-typescript/bundled-typescript';
import { resolveModuleFile } from './resolve-module-file';

// Real resolution over the real disk, against this folder's own files, with no proxy: it proves the wrapper hands `ts.sys` to the real resolver.
const NODE10 = { moduleResolution: ModuleResolutionKind.Node10 };

describe('resolveModuleFile against the real disk', () => {
  it('VALID: {relative specifier naming a sibling file} => returns that file', () => {
    const result = resolveModuleFile({
      specifier: './resolve-module-file',
      containingFile: `${__dirname}/caller.ts`,
      options: NODE10,
    });

    expect(result).toBe(`${__dirname}/resolve-module-file.ts`);
  });

  it('EMPTY: {relative specifier naming no file} => returns undefined', () => {
    const result = resolveModuleFile({
      specifier: './no-such-module',
      containingFile: `${__dirname}/caller.ts`,
      options: NODE10,
    });

    expect(result).toBe(undefined);
  });
});
