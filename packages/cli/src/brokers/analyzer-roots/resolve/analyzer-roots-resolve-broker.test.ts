
import { analyzerRootsResolveBroker } from './analyzer-roots-resolve-broker';
import { analyzerRootsResolveBrokerProxy } from './analyzer-roots-resolve-broker.proxy';

describe('analyzerRootsResolveBroker', () => {
  describe('resolving the analyzer source roots', () => {
    it('VALID: {default from = this module, inside the monorepo} => the core and shared src roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAboveThisModule();

      const roots = analyzerRootsResolveBroker().map((root) => root.split('/').slice(-3).join('/'));

      expect(roots).toStrictEqual(['packages/core/src', 'packages/shared/src']);
    });

    it('VALID: {from two levels below the monorepo root} => walks up to the root and returns its core and shared src roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo/packages/cli', root: '/repo' });

      const roots = analyzerRootsResolveBroker({ from: '/repo/packages/cli' });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/shared/src',
      ]);
    });

    it('VALID: {from the monorepo root itself} => returns its core and shared src roots without walking up', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo', root: '/repo' });

      const roots = analyzerRootsResolveBroker({ from: '/repo' });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/shared/src',
      ]);
    });

    it("VALID: {loaded from the CLI's dist tree} => the core and shared dist roots", () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo/packages/cli/dist/src/brokers/analyzer-roots/resolve', root: '/repo' });

      const roots = analyzerRootsResolveBroker({
        from: '/repo/packages/cli/dist/src/brokers/analyzer-roots/resolve',
      });

      expect(roots).toStrictEqual([
        '/repo/packages/core/dist',
        '/repo/packages/shared/dist',
      ]);
    });

    it("VALID: {loaded from the CLI's source tree} => the core and shared src roots", () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo/packages/cli/src/brokers/analyzer-roots/resolve', root: '/repo' });

      const roots = analyzerRootsResolveBroker({
        from: '/repo/packages/cli/src/brokers/analyzer-roots/resolve',
      });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/shared/src',
      ]);
    });

    it("EDGE: {loaded from a sibling of the CLI's dist folder whose name starts with dist} => the core and shared src roots", () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo/packages/cli/distant/resolve', root: '/repo' });

      const roots = analyzerRootsResolveBroker({ from: '/repo/packages/cli/distant/resolve' });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/shared/src',
      ]);
    });

    it('EMPTY: {from a path outside any monorepo} => no roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.noRootAbove({ from: '/nonexistent-xyz' });

      const roots = analyzerRootsResolveBroker({ from: '/nonexistent-xyz' });

      expect(roots).toStrictEqual([]);
    });
  });
});
