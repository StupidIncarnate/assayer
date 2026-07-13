/**
 * PURPOSE: Contract for a file analysis — the per-file analysis model carried alongside the raw
 *   map: every exported entry's function analysis plus the per-line enrichment facts. Threads from
 *   the cache blob through the desktop bridge into the detail-view enrichment and tests panels.
 *
 * USAGE:
 * fileAnalysisContract.parse({ functions: [], enrichment: [] });
 * // Returns a validated FileAnalysis (branded fields)
 */
import { z } from 'zod';

import { functionAnalysisContract } from '../function-analysis/function-analysis-contract';
import { lineEnrichmentContract } from '../line-enrichment/line-enrichment-contract';

export const fileAnalysisContract = z.object({
  functions: z.array(functionAnalysisContract),
  enrichment: z.array(lineEnrichmentContract),
});

export type FileAnalysis = z.infer<typeof fileAnalysisContract>;
