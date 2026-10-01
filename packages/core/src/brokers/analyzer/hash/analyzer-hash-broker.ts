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
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { isSourceFileIncludedGuard } from '../../../guards/is-source-file-included/is-source-file-included-guard';
import type { ContentHash } from '@assayer/shared/contracts';
import { readFile } from '#gateway/node/fs__promises';
import { relative } from '#gateway/node/path';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { relPathContract } from '@assayer/shared/contracts';

export const analyzerHashBroker = async ({ roots }: { roots: string[] }): Promise<ContentHash> => {
  const rootHashes = await Promise.all(
    roots.map(async (root) => {
      const files = await compileWalkWorkingTreeBroker({ root });
      const sources = files.map(String).filter((path) => isSourceFileIncludedGuard({ relPath: path }));
      const entries = await Promise.all(
        sources.map(async (path) => {
          const content = fileContentsContract.parse(await readFile(path));
          const relPath = relPathContract.parse(relative(root, path));
          return `${String(relPath)}:${String(contentHashTransformer({ content: String(content) }))}`;
        }),
      );
      return String(contentHashTransformer({ content: [...entries].sort().join('\n') }));
    }),
  );

  return contentHashTransformer({ content: rootHashes.join('\n') });
};
