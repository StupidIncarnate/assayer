/**
 * PURPOSE: Contract for a compiled file blob — the cached per-file compilation unit combining
 *   its map nodes (branch-construct entries) and source lines, keyed by path and content hash.
 *
 * USAGE:
 * compiledFileBlobContract.parse({
 *   relPath: 'packages/shared/src/index.ts',
 *   contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   nodes: [{ kind: 'function', startLine: 1, endLine: 5 }],
 *   lines: [{ n: 1, text: 'export const x = 1;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }],
 * });
 * // Returns a validated CompiledFileBlob (branded fields)
 */
import { z } from 'zod';

import { relPathContract } from '../rel-path/rel-path-contract';
import { contentHashContract } from '../content-hash/content-hash-contract';
import { mapNodeContract } from '../map-node/map-node-contract';
import { sourceLineContract } from '../source-line/source-line-contract';
import { fileAnalysisContract } from '../file-analysis/file-analysis-contract';

export const compiledFileBlobContract = z.object({
  relPath: relPathContract,
  contentHash: contentHashContract,
  nodes: z.array(mapNodeContract),
  lines: z.array(sourceLineContract),
  analysis: fileAnalysisContract.optional(),
});

export type CompiledFileBlob = z.infer<typeof compiledFileBlobContract>;
