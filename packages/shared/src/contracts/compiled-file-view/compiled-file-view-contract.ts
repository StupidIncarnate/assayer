/**
 * PURPOSE: Contract for a compiled file view — the rendered per-file projection combining its
 *   map nodes (branch-construct entries) and source lines, keyed by path, without the cache
 *   content hash used for invalidation.
 *
 * USAGE:
 * compiledFileViewContract.parse({
 *   relPath: 'src/foo.ts',
 *   lines: [{ n: 1, text: 'export const x = 1;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }],
 *   nodes: [{ kind: 'function', startLine: 1, endLine: 5 }],
 * });
 * // Returns a validated CompiledFileView (branded fields)
 */
import { z } from 'zod';

import { relPathContract } from '../rel-path/rel-path-contract';
import { sourceLineContract } from '../source-line/source-line-contract';
import { mapNodeContract } from '../map-node/map-node-contract';
import { fileAnalysisContract } from '../file-analysis/file-analysis-contract';

export const compiledFileViewContract = z.object({
  relPath: relPathContract,
  lines: z.array(sourceLineContract),
  nodes: z.array(mapNodeContract),
  analysis: fileAnalysisContract.optional(),
});

export type CompiledFileView = z.infer<typeof compiledFileViewContract>;
