import { nodeModuleBuiltinsAdapter } from './node-module-builtins-adapter';
import { nodeModuleBuiltinsAdapterProxy } from './node-module-builtins-adapter.proxy';

describe('nodeModuleBuiltinsAdapter', () => {
  describe('the builtin module list', () => {
    it('VALID: {} => includes the fs builtin exactly once', () => {
      nodeModuleBuiltinsAdapterProxy();

      const result = nodeModuleBuiltinsAdapter();

      expect(result.map(String).filter((name) => name === 'fs')).toStrictEqual(['fs']);
    });

    it('VALID: {} => includes the path builtin exactly once', () => {
      nodeModuleBuiltinsAdapterProxy();

      const result = nodeModuleBuiltinsAdapter();

      expect(result.map(String).filter((name) => name === 'path')).toStrictEqual(['path']);
    });

    it('EMPTY: {} => never lists an empty name', () => {
      nodeModuleBuiltinsAdapterProxy();

      const result = nodeModuleBuiltinsAdapter();

      expect(result.map(String).filter((name) => name === '')).toStrictEqual([]);
    });
  });
});
