import { join } from '#gateway/node/path';

import { analyzerRootsResolveBroker } from './analyzer-roots-resolve-broker';
import { analyzerRootsResolveBrokerProxy } from './analyzer-roots-resolve-broker.proxy';

describe('analyzerRootsResolveBroker', () => {
  describe('inside this monorepo', () => {
    it('VALID: {default from and module file = this module} => the src roots of core, the npm gateway and shared', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.monorepoAboveThisModule();
      const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');

      const roots = analyzerRootsResolveBroker();

      expect(roots).toStrictEqual([
        join(monorepoRoot, 'packages', 'core', 'src'),
        join(monorepoRoot, 'packages', '@gateway', 'npm', 'src'),
        join(monorepoRoot, 'packages', 'shared', 'src'),
      ]);
    });

    it('VALID: {the CLI runs as TypeScript source} => follows the workspace links to each package src', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.installedAt({
        from: '/repo/packages/cli/src/brokers/analyzer-roots/resolve',
        installDir: '/repo',
        packageDirs: {
          '@assayer/core': '/repo/packages/core',
          '@assayer/npm': '/repo/packages/@gateway/npm',
          '@assayer/shared': '/repo/packages/shared',
        },
      });

      const roots = analyzerRootsResolveBroker({
        from: '/repo/packages/cli/src/brokers/analyzer-roots/resolve',
        moduleFile: '/repo/packages/cli/src/brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.ts',
      });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/@gateway/npm/src',
        '/repo/packages/shared/src',
      ]);
    });

    it('VALID: {the CLI runs as compiled JavaScript} => follows the workspace links to each package dist', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.installedAt({
        from: '/repo/packages/cli/dist/src/brokers/analyzer-roots/resolve',
        installDir: '/repo',
        packageDirs: {
          '@assayer/core': '/repo/packages/core',
          '@assayer/npm': '/repo/packages/@gateway/npm',
          '@assayer/shared': '/repo/packages/shared',
        },
      });

      const roots = analyzerRootsResolveBroker({
        from: '/repo/packages/cli/dist/src/brokers/analyzer-roots/resolve',
        moduleFile: '/repo/packages/cli/dist/src/brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.js',
      });

      expect(roots).toStrictEqual([
        '/repo/packages/core/dist',
        '/repo/packages/@gateway/npm/dist',
        '/repo/packages/shared/dist',
      ]);
    });

    it('EDGE: {a TypeScript module file under a folder named dist} => the src roots, because the module file decides the tree', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.installedAt({
        from: '/repo/packages/cli/dist',
        installDir: '/repo',
        packageDirs: {
          '@assayer/core': '/repo/packages/core',
          '@assayer/npm': '/repo/packages/@gateway/npm',
          '@assayer/shared': '/repo/packages/shared',
        },
      });

      const roots = analyzerRootsResolveBroker({
        from: '/repo/packages/cli/dist',
        moduleFile: '/repo/packages/cli/dist/analyzer-roots-resolve-broker.ts',
      });

      expect(roots).toStrictEqual([
        '/repo/packages/core/src',
        '/repo/packages/@gateway/npm/src',
        '/repo/packages/shared/src',
      ]);
    });
  });

  describe("installed in a consumer's node_modules", () => {
    it('VALID: {the built CLI under node_modules/assayer, packages hoisted beside it} => the dist roots of the installed packages', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.installedAt({
        from: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve',
        installDir: '/app',
        packageDirs: {
          '@assayer/core': '/app/node_modules/@assayer/core',
          '@assayer/npm': '/app/node_modules/@assayer/npm',
          '@assayer/shared': '/app/node_modules/@assayer/shared',
        },
      });

      const roots = analyzerRootsResolveBroker({
        from: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve',
        moduleFile: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.js',
      });

      expect(roots).toStrictEqual([
        '/app/node_modules/@assayer/core/dist',
        '/app/node_modules/@assayer/npm/dist',
        '/app/node_modules/@assayer/shared/dist',
      ]);
    });

    it('VALID: {packages nested under node_modules/assayer/node_modules} => the nearest copy, the one Node loads', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.installedAt({
        from: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve',
        installDir: '/app/node_modules/assayer',
        packageDirs: {
          '@assayer/core': '/app/node_modules/assayer/node_modules/@assayer/core',
          '@assayer/npm': '/app/node_modules/assayer/node_modules/@assayer/npm',
          '@assayer/shared': '/app/node_modules/assayer/node_modules/@assayer/shared',
        },
      });

      const roots = analyzerRootsResolveBroker({
        from: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve',
        moduleFile: '/app/node_modules/assayer/dist/src/brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.js',
      });

      expect(roots).toStrictEqual([
        '/app/node_modules/assayer/node_modules/@assayer/core/dist',
        '/app/node_modules/assayer/node_modules/@assayer/npm/dist',
        '/app/node_modules/assayer/node_modules/@assayer/shared/dist',
      ]);
    });
  });

  describe('a package that is not installed', () => {
    it('ERROR: {no node_modules/@assayer/core above the start} => throws, naming the manifest it looked for', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.notInstalledAbove({ from: '/lonely/bin', packageName: '@assayer/core' });

      expect(() =>
        analyzerRootsResolveBroker({ from: '/lonely/bin', moduleFile: '/lonely/bin/assayer.js' }),
      ).toThrow(
        /^assayer: cannot locate an installed Assayer package: no node_modules\/@assayer\/core\/package\.json in \/lonely\/bin or any directory above it\. The install is incomplete; reinstall assayer\.$/u,
      );
    });
  });
});
