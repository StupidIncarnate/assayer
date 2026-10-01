import { importSpecifierResolveBroker } from './import-specifier-resolve-broker';
import { importSpecifierResolveBrokerProxy } from './import-specifier-resolve-broker.proxy';

describe('importSpecifierResolveBroker', () => {
  describe('a relative specifier that resolves to a sibling file', () => {
    it('VALID: {specifier "../b/foo" from src/a/caller.ts} => resolves to the sibling absolute path', () => {
      const proxy = importSpecifierResolveBrokerProxy();
      proxy.resolvesTo({ specifier: '../b/foo', containingFile: '/repo/src/a/caller.ts', fileName: '/repo/src/b/foo.ts' });

      const result = importSpecifierResolveBroker({
        specifier: '../b/foo',
        containingFile: '/repo/src/a/caller.ts',
        options: {},
      });

      expect(result).toStrictEqual({ resolved: true, fileName: '/repo/src/b/foo.ts' });
    });
  });

  describe('a relative specifier that points at nothing', () => {
    it('EMPTY: {specifier "./missing"} => resolved false', () => {
      const proxy = importSpecifierResolveBrokerProxy();
      proxy.resolvesToNothing({ specifier: './missing', containingFile: '/repo/src/caller.ts' });

      const result = importSpecifierResolveBroker({
        specifier: './missing',
        containingFile: '/repo/src/caller.ts',
        options: {},
      });

      expect(result).toStrictEqual({ resolved: false });
    });
  });

  describe('a bare specifier that resolves into node_modules', () => {
    it('VALID: {specifier "vendored-pkg"} => resolves to the vendored package types file', () => {
      const proxy = importSpecifierResolveBrokerProxy();
      proxy.resolvesTo({
        specifier: 'vendored-pkg',
        containingFile: '/repo/src/caller.ts',
        fileName: '/repo/node_modules/vendored-pkg/index.d.ts',
      });

      const result = importSpecifierResolveBroker({
        specifier: 'vendored-pkg',
        containingFile: '/repo/src/caller.ts',
        options: {},
      });

      expect(result).toStrictEqual({ resolved: true, fileName: '/repo/node_modules/vendored-pkg/index.d.ts' });
    });
  });
});
