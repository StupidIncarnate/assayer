/**
 * PURPOSE: Resolves the on-disk roots of the @assayer/core and @assayer/shared code this CLI runs, the
 *   code a cached blob depends on, so the cache fingerprint (analyzerHashBroker) hashes exactly that
 *   code. It walks UP from this module's location to the monorepo root, the nearest ancestor that
 *   contains packages/core/src. Find-up keeps it correct at any depth, including the extra `dist/`
 *   level of the built binary.
 *
 *   The tree follows where this module was loaded from, the same test `coreRuntimeTransformer` makes.
 *   Loaded from `packages/cli/dist`, the CLI is the built binary, Node resolves core and shared to
 *   their `dist`, and the roots are `packages/{core,shared}/dist`. Loaded from anywhere else, the CLI
 *   runs from source and the roots are `packages/{core,shared}/src`. Returns [] when run outside a
 *   monorepo, where the fingerprint degrades to a constant: it over-caches, never mis-caches.
 *
 * USAGE:
 * analyzerRootsResolveBroker();
 * // Returns [<root>/packages/core/dist, <root>/packages/shared/dist] from the built CLI, or the two
 * // src roots from source, as branded FilePath[]
 */
import { existsSync } from '#gateway/node/fs';
import { join, dirname } from '#gateway/node/path';

export const analyzerRootsResolveBroker = ({
  from,
  loadedFrom,
}: { from?: string; loadedFrom?: string } = {}): string[] => {
  const dir = from === undefined ? __dirname : from;
  const origin = loadedFrom === undefined ? dir : loadedFrom;

  if (existsSync(join(dir, 'packages', 'core', 'src'))) {
    const cliDist = join(dir, 'packages', 'cli', 'dist');
    // The `/` after the folder name keeps a sibling such as `distant` from counting as `dist`.
    const tree = origin === cliDist || origin.startsWith(`${cliDist}/`) ? 'dist' : 'src';
    return [
      join(dir, 'packages', 'core', tree),
      join(dir, 'packages', 'shared', tree),
    ];
  }

  const parent = dirname(dir);
  if (parent === dir) {
    return [];
  }

  return analyzerRootsResolveBroker({ from: parent, loadedFrom: origin });
};
