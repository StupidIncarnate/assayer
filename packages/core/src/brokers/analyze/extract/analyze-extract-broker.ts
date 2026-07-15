/**
 * PURPOSE: Extracts the analysis model from a source string — walks the file once, then projects the
 *   result into entries with their branches and exits. It is the analyzer's structural surface: what
 *   the syntax-specimen catalogue asserts against, and the smallest thing that answers "what does
 *   Assayer understand about this code?".
 *
 *   The compile pipeline does NOT go through here; it walks once and runs both projections itself,
 *   so a file is never parsed twice. This exists for callers that have source and want only the
 *   analysis.
 *
 * USAGE:
 * analyzeExtractBroker({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts' });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import type { AnalysisExtractResult } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';
import { analysisProjectionTransformer } from '../../../transformers/analysis-projection/analysis-projection-transformer';

export const analyzeExtractBroker = ({
  source,
  relPath,
}: {
  source: string;
  relPath: string;
}): AnalysisExtractResult =>
  analysisProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
