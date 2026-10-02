/**
 * PURPOSE: Compiles a single source file into its cached blob — finding the tsconfig that owns the file,
 *   keying the blob on the file's bytes plus the analysis options that owner gives it (`analysisHash`),
 *   reusing an already-cached blob for that key without touching ts-morph, and otherwise walking the file
 *   ONCE under those options and projecting that single walk into both the type-graph map and the analysis
 *   before writing the blob atomically (tmp file + rename) so a crash mid-write never leaves a corrupt blob
 *   at its final path. The map and the analysis are two views of one parse, so they cannot disagree about
 *   the file and it is never parsed twice. `contentHash` stays the hash of the bytes alone.
 *
 * USAGE:
 * await compileProcessFileBroker({
 *   root: '/repo',
 *   relPath: 'src/index.ts',
 *   content: 'export function foo() { return 1; }',
 *   blobsDir: '/repo/.assayer/cache/blobs',
 * });
 * // Returns { reused: true, contentHash, analysisHash } when a blob already exists for that key,
 * // { reused: false, contentHash, analysisHash } after writing a freshly compiled blob, or
 * // { reused: false, error: { line, column, message } } when the source fails to parse
 */
import { analysisHashTransformer } from '../../../transformers/analysis-hash/analysis-hash-transformer';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { mapProjectionTransformer } from '../../../transformers/map-projection/map-projection-transformer';
import { moduleGraphProjectionTransformer } from '../../../transformers/module-graph-projection/module-graph-projection-transformer';

import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';
import { tsconfigOwnerBroker } from '../../tsconfig/owner/tsconfig-owner-broker';
import { compiledFileBlobContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';
import type { MapExtractResult } from '../../../contracts/map-extract-result/map-extract-result-contract';
import { ensureDir, pathExists, rename, writeFile } from '#gateway/node/fs__promises';

export const compileProcessFileBroker = async ({
  root,
  relPath,
  content,
  blobsDir,
}: {
  root: string;
  relPath: string;
  content: string;
  blobsDir: string;
}): Promise<
  | { reused: true; contentHash: ContentHash; analysisHash: ContentHash }
  | { reused: false; contentHash: ContentHash; analysisHash: ContentHash }
  | { reused: false; error: Extract<MapExtractResult, { success: false }>['error'] }
> => {
  const contentHash = contentHashTransformer({ content });
  const { options } = tsconfigOwnerBroker({ absPath: `${root}/${relPath}` });
  const analysisHash = analysisHashTransformer({ content, options });
  const blobPath = `${blobsDir}/${analysisHash}.json`;

  if (await pathExists(blobPath)) {
    return { reused: true, contentHash, analysisHash };
  }

  const walked = walkFileTransformer({ source: content, relPath, compilerOptions: options });
  const extracted = mapProjectionTransformer({ walked });

  if (!extracted.success) {
    return {
      reused: false,
      error: extracted.error,
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
    relPath,
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

  return { reused: false, contentHash, analysisHash };
};
