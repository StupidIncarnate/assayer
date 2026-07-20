/**
 * PURPOSE: Reads a file's raw text contents from disk SYNCHRONOUSLY using node's `readFileSync`.
 *
 *   The synchronous read exists for the analysis-time callers that cannot await: the cross-file
 *   predicate overlay runs inside the synchronous projection chain that produces a FileAnalysis, and
 *   the test harness that drives it reports its result to `it.each` and `toStrictEqual` directly.
 *   Making either async would ripple through every synchronous consumer of that analysis.
 *
 * USAGE:
 * const contents = fsReadFileSyncAdapter({ path: '/repo/src/index.ts' });
 * // Returns validated FileContents (branded string); underlying fs errors propagate unmodified.
 */
import { readFileSync } from 'fs';

import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileSyncAdapter = ({ path }: { path: string }): FileContents =>
  fileContentsContract.parse(readFileSync(path, 'utf8'));
