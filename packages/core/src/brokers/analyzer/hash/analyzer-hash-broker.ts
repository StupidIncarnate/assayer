/**
 * PURPOSE: Computes a deterministic content hash of the code Assayer itself runs, the code a cached
 *   blob depends on, so the cache invalidates whenever Assayer's analysis logic changes, with no
 *   hand-maintained version to bump. Each root is one tree: a root whose last folder is `dist` is a
 *   compiled tree and hashes its emitted `.js`; any other root is a source tree and hashes only its
 *   implementation files, never a proxy, stub, test or harness (see isAnalyzerCodeFileGuard). So an
 *   edit to code that does not run never moves the hash.
 *
 *   Each file contributes its root-relative path plus its content hash, sorted, then the per-root
 *   digests fold into one hash. Root-relative paths keep the result identical across machines and
 *   checkout locations. Sorting keeps it independent of walk order.
 *
 * USAGE:
 * await analyzerHashBroker({ roots: ['/repo/packages/core/dist', '/repo/packages/shared/dist'] });
 * // Returns a ContentHash that changes when a hashed file's path or content changes
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { isAnalyzerCodeFileGuard } from '../../../guards/is-analyzer-code-file/is-analyzer-code-file-guard';
import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import type { ContentHash } from '@assayer/shared/contracts';
import { readFile } from '#gateway/node/fs__promises';
import { basename, relative } from '#gateway/node/path';
import { relPathContract } from '@assayer/shared/contracts';

export const analyzerHashBroker = async ({ roots }: { roots: string[] }): Promise<ContentHash> => {
  const rootHashes = await Promise.all(
    roots.map(async (root) => {
      const tree = basename(root) === coreRuntimeStatics.layout.distFolder ? 'dist' : 'source';
      const files = await compileWalkWorkingTreeBroker({ root });
      const codeFiles = files
        .map((path) => ({ path: String(path), relPath: relPathContract.parse(relative(root, String(path))) }))
        .filter(({ relPath }) => isAnalyzerCodeFileGuard({ relPath: String(relPath), tree }));
      const entries = await Promise.all(
        codeFiles.map(async ({ path, relPath }) => {
          const content = (await readFile(path));
          return `${String(relPath)}:${String(contentHashTransformer({ content: String(content) }))}`;
        }),
      );
      return String(contentHashTransformer({ content: [...entries].sort().join('\n') }));
    }),
  );

  return contentHashTransformer({ content: rootHashes.join('\n') });
};
