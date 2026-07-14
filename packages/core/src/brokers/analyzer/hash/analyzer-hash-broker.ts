/**
 * PURPOSE: Computes a deterministic content hash of the ANALYZER's own source — the code whose
 *   behavior a cached blob depends on — so the cache invalidates automatically whenever Assayer's
 *   analysis logic changes, with NO hand-maintained version to bump. Walks each given source root
 *   (skipping node_modules), hashes every included TypeScript source file (test-named files
 *   excluded — see isSourceFileIncludedGuard) by its root-relative path plus content, sorts, and
 *   folds the per-root digests into one hash. Root-RELATIVE paths keep the result identical across
 *   machines / checkout locations; sorting keeps it independent of walk order.
 *
 * USAGE:
 * await analyzerHashBroker({ roots: ['/repo/packages/core/src', '/repo/packages/shared/src'] });
 * // Returns a ContentHash that changes iff a hashed source file's path or content changes
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { isSourceFileIncludedGuard } from '../../../guards/is-source-file-included/is-source-file-included-guard';
import type { ContentHash } from '@assayer/shared/contracts';

export const analyzerHashBroker = async ({ roots }: { roots: string[] }): Promise<ContentHash> => {
  const rootHashes = await Promise.all(
    roots.map(async (root) => {
      const files = await compileWalkWorkingTreeBroker({ root });
      const sources = files.map(String).filter((path) => isSourceFileIncludedGuard({ relPath: path }));
      const entries = await Promise.all(
        sources.map(async (path) => {
          const content = await fsReadFileAdapter({ path });
          const relPath = pathRelativeAdapter({ from: root, to: path });
          return `${String(relPath)}:${String(cryptoSha256Adapter({ content: String(content) }))}`;
        }),
      );
      return String(cryptoSha256Adapter({ content: [...entries].sort().join('\n') }));
    }),
  );

  return cryptoSha256Adapter({ content: rootHashes.join('\n') });
};
