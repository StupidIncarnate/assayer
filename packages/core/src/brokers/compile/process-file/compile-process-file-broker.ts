/**
 * PURPOSE: Compiles a single source file into its cached blob — hashing the content, reusing an
 *   already-cached blob for that hash without touching ts-morph, and otherwise walking the file ONCE
 *   and projecting that single walk into both the type-graph map and the analysis before writing the
 *   blob atomically (tmp file + rename) so a crash mid-write never leaves a corrupt blob at its
 *   final path. The map and the analysis are two views of one parse, so they cannot disagree about
 *   the file and it is never parsed twice.
 *
 * USAGE:
 * await compileProcessFileBroker({
 *   relPath: 'src/index.ts',
 *   content: 'export function foo() { return 1; }',
 *   blobsDir: '/repo/.assayer/cache/blobs',
 * });
 * // Returns { reused: true, contentHash } when a blob already exists for that content hash,
 * // { reused: false, contentHash } after writing a freshly compiled blob, or
 * // { reused: false, error: { line, column, message } } when the source fails to parse
 */
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { mapProjectionTransformer } from '../../../transformers/map-projection/map-projection-transformer';
import { moduleGraphProjectionTransformer } from '../../../transformers/module-graph-projection/module-graph-projection-transformer';

import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';
import { compiledFileBlobContract, relPathContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';
import type { SourcePosition } from '../../../contracts/source-position/source-position-contract';
import { ensureDir, pathExists, rename, writeFile } from '#gateway/node/fs__promises';

export const compileProcessFileBroker = async ({
  relPath,
  content,
  blobsDir,
}: {
  relPath: string;
  content: string;
  blobsDir: string;
}): Promise<
  | { reused: true; contentHash: ContentHash }
  | { reused: false; contentHash: ContentHash }
  | { reused: false; error: { message: string } & SourcePosition }
> => {
  const contentHash = contentHashTransformer({ content });
  const blobPath = `${blobsDir}/${contentHash}.json`;

  if (await pathExists(blobPath)) {
    return { reused: true, contentHash };
  }

  const walked = walkFileTransformer({ source: content, relPath });
  const extracted = mapProjectionTransformer({ walked });

  if (!extracted.success) {
    return {
      reused: false,
      error: {
        line: extracted.error.line,
        column: extracted.error.column,
        message: String(extracted.error.message),
      },
    };
  }

  const displayLines = content.split('\n').map((text, index) => ({
    n: index + 1,
    text,
    hash: contentHashTransformer({ content: text }),
  }));

  const analysis = analyzeFileBroker({ walked, relPath });
  const moduleGraph = moduleGraphProjectionTransformer({ walked });

  const blob = compiledFileBlobContract.parse({
    relPath: relPathContract.parse(relPath),
    contentHash,
    nodes: extracted.nodes,
    displayLines,
    analysis,
    moduleGraph,
  });

  await ensureDir(blobsDir);
  const tmpPath = `${blobPath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(blob));
  await rename(tmpPath, blobPath);

  return { reused: false, contentHash };
};
