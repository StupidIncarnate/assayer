/**
 * PURPOSE: Resolves the on-disk code roots of the packages whose code decides what Assayer's analysis
 *   produces: @assayer/core, @assayer/npm (the gateway that loads ts-morph and wraps TypeScript's
 *   module resolution) and @assayer/shared. The cache fingerprint (analyzerHashBroker) hashes these
 *   roots, so a cached blob is reused only by the code that wrote it. The files at core's package root
 *   that the wrapped runner loads by path sit outside every root; analyzerHashBroker finds and hashes
 *   those itself, from core's own run-time statics.
 *
 *   Each package is found the way Node finds it for this CLI: the nearest
 *   `node_modules/<name>/package.json` in this module's directory or any directory above it, then
 *   followed through symlinks to its real directory. That one rule covers this monorepo (the
 *   workspace link in the root `node_modules` leads to `packages/...`) and an installed Assayer in a
 *   consumer's `node_modules` alike, with no folder name assumed.
 *
 *   The tree follows what is running. When this module is TypeScript (ts-jest, tsx), the CLI runs
 *   from source and each root is the package's `src`. When it is compiled JavaScript, each root is
 *   the package's `dist`, the only tree an installed package ships. A package that cannot be found
 *   throws, because a fingerprint with a missing package would let one Assayer reuse another's cache.
 *
 * USAGE:
 * analyzerRootsResolveBroker();
 * // Returns ['<core>/dist', '<npm gateway>/dist', '<shared>/dist'] from the built CLI, or the
 * // three src roots from source
 */
import { findUpSync, realpathSync } from '#gateway/node/fs';
import { dirname, extname, join } from '#gateway/node/path';

export const analyzerRootsResolveBroker = ({
  from,
  moduleFile,
}: { from?: string; moduleFile?: string } = {}): string[] => {
  const startDir = from === undefined ? __dirname : from;
  const loadedFile = moduleFile === undefined ? __filename : moduleFile;
  const tree = extname(loadedFile) === '.ts' ? 'src' : 'dist';

  // Sorted by package name, so the roots, and the hash folded from them, come out in one fixed order.
  const manifestNames = [
    join('node_modules', '@assayer', 'core', 'package.json'),
    join('node_modules', '@assayer', 'npm', 'package.json'),
    join('node_modules', '@assayer', 'shared', 'package.json'),
  ];

  return manifestNames.map((fileName) => {
    const manifest = findUpSync({ startDir, fileName });

    if (manifest === null) {
      throw new Error(
        `assayer: cannot locate an installed Assayer package: no ${fileName} in ${startDir} or any directory ` +
          'above it. The install is incomplete; reinstall assayer.',
      );
    }

    return join(realpathSync(dirname(manifest)), tree);
  });
};
