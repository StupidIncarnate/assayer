/**
 * PURPOSE: Contract for a file analysis — the per-file analysis model carried alongside the raw
 *   map: every analyzed entry's function analysis, the per-line enrichment facts, and the dark
 *   spots the walk could not follow. Threads from the cache blob through the desktop bridge into
 *   the detail-view enrichment and tests panels. `darkSpots` is REQUIRED, not optional: a file
 *   analysis must always state what it failed to understand, because an analysis that can omit
 *   its own blind spots reads as complete when it isn't.
 *
 * USAGE:
 * fileAnalysisContract.parse({ functions: [], enrichment: [], darkSpots: [] });
 * // Returns a validated FileAnalysis (branded fields)
 */
import { z } from 'zod';

import { darkSpotContract } from '../dark-spot/dark-spot-contract';
import { functionAnalysisContract } from '../function-analysis/function-analysis-contract';
import { lineEnrichmentContract } from '../line-enrichment/line-enrichment-contract';

export const fileAnalysisContract = z.object({
  functions: z.array(functionAnalysisContract),
  enrichment: z.array(lineEnrichmentContract),
  darkSpots: z.array(darkSpotContract),
});

export type FileAnalysis = z.infer<typeof fileAnalysisContract>;
