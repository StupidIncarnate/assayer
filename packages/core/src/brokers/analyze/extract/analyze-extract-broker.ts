/**
 * PURPOSE: Extracts the analysis model from a source string — walks the file once, then projects the
 *   result into entries with their branches and exits. It is the analyzer's structural surface: what
 *   the syntax-specimen catalogue asserts against, and the smallest thing that answers "what does
 *   Assayer understand about this code?".
 *
 *   The compile pipeline does NOT go through here; it walks once and runs both projections itself,
 *   so a file is never parsed twice. This exists for callers that have source and want only the
 *   analysis. `absPath` is the file on disk: the walk reads it under the tsconfig that owns it, the same
 *   options the compile and the run use, so the catalogue and the pipeline analyse one file one way.
 *
 * USAGE:
 * analyzeExtractBroker({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts', absPath: '/repo/src/f.ts' });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import type { AnalysisExtractResult } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';
import { analysisProjectionTransformer } from '../../../transformers/analysis-projection/analysis-projection-transformer';
import { fileWalkBroker } from '../../file/walk/file-walk-broker';

export const analyzeExtractBroker = ({
  source,
  relPath,
  absPath,
}: {
  source: string;
  relPath: string;
  absPath: string;
}): AnalysisExtractResult =>
  analysisProjectionTransformer({ walked: fileWalkBroker({ source, relPath, absPath }) });
