/**
 * PURPOSE: Contract for a compiled file view — the rendered per-file projection combining its
 *   map nodes (branch-construct entries), source lines, derived analysis, and the cross-file imports
 *   THIS file makes (the stitch pass's resolved edges whose `from` is this path), keyed by path. The
 *   cache content hash (the blob's on-disk key) is carried optionally so an inspection surface can
 *   show the exact blob; it is never used to drive the render.
 *
 * USAGE:
 * compiledFileViewContract.parse({
 *   relPath: 'src/foo.ts',
 *   contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   displayLines: [{ n: 1, text: 'export const x = 1;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }],
 *   nodes: [{ kind: 'function', startLine: 1, endLine: 5 }],
 *   resolvedEdges: [],
 * });
 * // Returns a validated CompiledFileView (branded fields)
 */
import { z } from 'zod';

import { relPathContract } from '../rel-path/rel-path-contract';
import { contentHashContract } from '../content-hash/content-hash-contract';
import { sourceLineContract } from '../source-line/source-line-contract';
import { mapNodeContract } from '../map-node/map-node-contract';
import { fileAnalysisContract } from '../file-analysis/file-analysis-contract';
import { resolvedEdgeContract } from '../resolved-edge/resolved-edge-contract';

export const compiledFileViewContract = z.object({
  relPath: relPathContract,
  contentHash: contentHashContract.optional(),
  // Raw per-line source for DISPLAY only (the code viewer / raw-blob view). Never read by analysis.
  displayLines: z.array(sourceLineContract),
  nodes: z.array(mapNodeContract),
  analysis: fileAnalysisContract.optional(),
  // The cross-file imports THIS file makes, resolved by the stitch pass to their canonical definition
  // (a local file, an npm package, or a node builtin — package/builtin edges carrying the declared
  // signature once read). The resolver filters the per-namespace resolved index to `from === relPath`.
  // Empty for a file that imports nothing, and defaulted so an older cache view still parses.
  resolvedEdges: z.array(resolvedEdgeContract).default([]),
});

export type CompiledFileView = z.infer<typeof compiledFileViewContract>;
