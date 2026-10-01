import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { realpathSyncProxy } from '#gateway/node/fs/realpath-sync/realpath-sync.proxy';
import { join } from '#gateway/node/path';

// The broker looks for `<dir>/node_modules/<package>/package.json` in each directory from its start
// upward, then follows the hit through realpath. A scenario stages each probe by its exact path, so
// a directory or package no scenario staged reaches an unstaged call, which throws.
export const analyzerRootsResolveBrokerProxy = (): {
  installedAt: ({
    from,
    installDir,
    packageDirs,
  }: {
    from: string;
    installDir: string;
    packageDirs: Readonly<Record<string, string>>;
  }) => void;
  notInstalledAbove: ({ from, packageName }: { from: string; packageName: string }) => void;
  monorepoAboveThisModule: () => void;
} => {
  const findUpProxy = findUpSyncProxy();
  const realpathProxy = realpathSyncProxy();

  // Every directory from `from` up to `top`, inclusive, deepest first.
  const directoriesUpTo = ({ from, top }: { from: string; top: string }): string[] => {
    const segments = from.split('/');
    return segments
      .map((_segment, index) => segments.slice(0, index + 1).join('/'))
      .map((directory) => (directory === '' ? '/' : directory))
      .filter((directory) => directory.length >= top.length)
      .reverse();
  };

  // Each package's manifest is missing from every directory below `installDir` and present in
  // `installDir/node_modules`. Its `node_modules` entry resolves through realpath to the directory
  // the scenario names: a workspace folder in the monorepo, or the same path in a plain install.
  const installedAt = ({
    from,
    installDir,
    packageDirs,
  }: {
    from: string;
    installDir: string;
    packageDirs: Readonly<Record<string, string>>;
  }): void => {
    Object.entries(packageDirs).forEach(([packageName, realDir]) => {
      directoriesUpTo({ from, top: installDir }).forEach((directory) => {
        (directory === installDir ? findUpProxy.foundAt : findUpProxy.notFound)({
          path: join(directory, 'node_modules', packageName, 'package.json'),
        });
      });
      realpathProxy.returns({ path: join(installDir, 'node_modules', packageName), resolved: realDir });
    });
  };

  return {
    installedAt,
    // No directory from `from` up to the filesystem root holds the package.
    notInstalledAbove: ({ from, packageName }: { from: string; packageName: string }): void => {
      directoriesUpTo({ from, top: '/' }).forEach((directory) => {
        findUpProxy.notFound({ path: join(directory, 'node_modules', packageName, 'package.json') });
      });
    },
    // The broker's default start is its own directory, which is this proxy's directory too. The
    // monorepo root sits six levels above it: resolve, analyzer-roots, brokers, src, cli, packages.
    // Its `node_modules` links each package to its workspace folder.
    monorepoAboveThisModule: (): void => {
      const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');
      installedAt({
        from: __dirname,
        installDir: monorepoRoot,
        packageDirs: {
          '@assayer/core': join(monorepoRoot, 'packages', 'core'),
          '@assayer/npm': join(monorepoRoot, 'packages', '@gateway', 'npm'),
          '@assayer/shared': join(monorepoRoot, 'packages', 'shared'),
        },
      });
    },
  };
};
