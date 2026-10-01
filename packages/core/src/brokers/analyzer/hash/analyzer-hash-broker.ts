/**
 * PURPOSE: Computes a deterministic content hash of the code Assayer itself runs, the code a cached
 *   blob depends on, so the cache invalidates whenever Assayer's analysis logic changes, with no
 *   hand-maintained version to bump. Each root is one tree: a root whose last folder is `dist` is a
 *   compiled tree and hashes its emitted `.js`; any other root is a source tree and hashes only its
 *   implementation files, never a proxy, stub, test or harness (see isAnalyzerCodeFileGuard). So an
 *   edit to code that does not run never moves the hash.
 *
 *   The hash also covers the installed ts-morph version. ts-morph bundles the TypeScript compiler
 *   that parses every file, so a ts-morph upgrade can change the analysis without changing a byte
 *   of Assayer's own code. ts-morph is found the way Node finds it for the code that loads it: from
 *   @assayer/npm (the package `#gateway/npm/ts-morph` maps to), which is itself found from this
 *   module's directory, each through the nearest `node_modules/<name>/package.json` above.
 *
 *   Each file contributes its root-relative path plus its content hash, sorted, then the per-root
 *   digests fold into one hash after the ts-morph version line. Root-relative paths keep the result
 *   identical across machines and checkout locations. Sorting keeps it independent of walk order.
 *
 * USAGE:
 * await analyzerHashBroker({ roots: ['/repo/packages/core/dist', '/repo/packages/shared/dist'] });
 * // Returns a ContentHash that changes when a hashed file's path or content, or ts-morph's version,
 * // changes
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { isAnalyzerCodeFileGuard } from '../../../guards/is-analyzer-code-file/is-analyzer-code-file-guard';
import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import type { ContentHash } from '@assayer/shared/contracts';
import { findUpSync, readJsonFileSync, realpathSync } from '#gateway/node/fs';
import { readFile } from '#gateway/node/fs__promises';
import { basename, dirname, join, relative } from '#gateway/node/path';
import { z } from '#gateway/npm/zod';

const tsMorphManifestContract = z.object({ version: z.string().min(1).brand<'TsMorphManifestVersion'>() });

export const analyzerHashBroker = async ({
  roots,
  from,
}: {
  roots: string[];
  from?: string;
}): Promise<ContentHash> => {
  const startDir = from === undefined ? __dirname : from;
  const gatewayManifest = findUpSync({ startDir, fileName: join('node_modules', '@assayer', 'npm', 'package.json') });
  if (gatewayManifest === null) {
    throw new Error(
      `assayer: cannot locate the installed package @assayer/npm: no node_modules/@assayer/npm/package.json in ${startDir} ` +
        'or any directory above it. The install is incomplete; reinstall assayer.',
    );
  }

  const gatewayDir = realpathSync(dirname(gatewayManifest));
  const tsMorphManifest = findUpSync({ startDir: gatewayDir, fileName: join('node_modules', 'ts-morph', 'package.json') });
  if (tsMorphManifest === null) {
    throw new Error(
      `assayer: cannot locate the installed package ts-morph: no node_modules/ts-morph/package.json in ${gatewayDir} ` +
        'or any directory above it. The install is incomplete; reinstall assayer.',
    );
  }

  const { version } = tsMorphManifestContract.parse(readJsonFileSync(tsMorphManifest));

  const rootHashes = await Promise.all(
    roots.map(async (root) => {
      const tree = basename(root) === coreRuntimeStatics.layout.distFolder ? 'dist' : 'source';
      const files = await compileWalkWorkingTreeBroker({ root });
      const codeFiles = files
        .map((path) => ({ path, relPath: relative(root, path) }))
        .filter(({ relPath }) => isAnalyzerCodeFileGuard({ relPath, tree }));
      const entries = await Promise.all(
        codeFiles.map(async ({ path, relPath }) => {
          const content = (await readFile(path));
          return `${relPath}:${contentHashTransformer({ content })}`;
        }),
      );
      return contentHashTransformer({ content: [...entries].sort().join('\n') });
    }),
  );

  return contentHashTransformer({ content: [`ts-morph@${version}`, ...rootHashes].join('\n') });
};
