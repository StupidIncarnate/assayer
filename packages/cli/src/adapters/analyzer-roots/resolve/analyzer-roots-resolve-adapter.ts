/**
 * PURPOSE: Resolves the on-disk roots of Assayer's OWN analyzer source — the code whose behavior a
 *   cached blob depends on — by walking UP from this module's location to the monorepo root (the
 *   nearest ancestor that contains packages/core/src). Find-up (rather than a fixed relative depth)
 *   keeps it correct whether the CLI runs from src (ts-jest / tsx) or from the built dist binary,
 *   whose extra `dist/` level would break a hardcoded `../..` count. Returns the @assayer/core and
 *   @assayer/shared source roots so the cache-invalidation fingerprint (analyzerHashBroker) is a
 *   content hash of real code instead of a hand-maintained version string. Returns [] when run
 *   outside a monorepo (the fingerprint then degrades to a constant — safe: over-caches, never
 *   mis-caches).
 *
 * USAGE:
 * analyzerRootsResolveAdapter();
 * // Returns [<root>/packages/core/src, <root>/packages/shared/src] as branded FilePath[]
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { filePathContract } from '@assayer/core/contracts';
import type { FilePath } from '@assayer/core/contracts';

export const analyzerRootsResolveAdapter = ({ from }: { from?: FilePath } = {}): FilePath[] => {
  const dir = from === undefined ? __dirname : String(from);

  if (existsSync(join(dir, 'packages', 'core', 'src'))) {
    return [
      filePathContract.parse(join(dir, 'packages', 'core', 'src')),
      filePathContract.parse(join(dir, 'packages', 'shared', 'src')),
    ];
  }

  const parent = dirname(dir);
  if (parent === dir) {
    return [];
  }

  return analyzerRootsResolveAdapter({ from: filePathContract.parse(parent) });
};
