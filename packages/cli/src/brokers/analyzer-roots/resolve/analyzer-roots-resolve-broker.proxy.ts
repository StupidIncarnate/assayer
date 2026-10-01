import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { join } from '#gateway/node/path';

// The broker probes `<dir>/packages/core/src` for each directory from its start upward. A scenario
// stages that probe by the exact path of each directory it reaches, so a directory no scenario
// staged reaches an unstaged call, which throws.
export const analyzerRootsResolveBrokerProxy = (): {
  rootAt: ({ from, root }: { from: string; root: string }) => void;
  noRootAbove: ({ from }: { from: string }) => void;
  rootAboveThisModule: () => void;
} => {
  const existsProxy = existsSyncProxy();

  // Every directory from `from` up to `root`, inclusive, lacks core's source except `root` itself.
  const rootAt = ({ from, root }: { from: string; root: string }): void => {
    const segments = from.split('/');
    segments
      .map((_segment, index) => segments.slice(0, index + 1).join('/'))
      .map((directory) => (directory === '' ? '/' : directory))
      .filter((directory) => directory.length >= root.length)
      .forEach((directory) => {
        existsProxy.returns({ path: join(directory, 'packages', 'core', 'src'), exists: directory === root });
      });
  };

  return {
    rootAt,
    // Every directory from `from` up to the filesystem root lacks core's source.
    noRootAbove: ({ from }: { from: string }): void => {
      const segments = from.split('/');
      segments
        .map((_segment, index) => segments.slice(0, index + 1).join('/'))
        .forEach((directory) => {
          existsProxy.returns({
            path: join(directory === '' ? '/' : directory, 'packages', 'core', 'src'),
            exists: false,
          });
        });
    },
    // The broker's default start is its own directory, which is this proxy's directory too. The
    // monorepo root sits six levels above it: resolve, analyzer-roots, brokers, src, cli, packages.
    rootAboveThisModule: (): void => {
      rootAt({ from: __dirname, root: join(__dirname, '..', '..', '..', '..', '..', '..') });
    },
  };
};
