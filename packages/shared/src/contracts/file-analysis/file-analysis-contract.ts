/**
 * PURPOSE: Contract for a file analysis — the per-file analysis model carried alongside the raw
 *   map: every analyzed entry's function analysis, the per-line enrichment facts, the dark spots the
 *   walk could not follow, and the logic it read but cannot drive. Threads from the cache blob
 *   through the desktop bridge into the detail-view enrichment and tests panels.
 *
 *   `darkSpots` and `undriven` are both REQUIRED, not optional: a file analysis must always state
 *   what it failed to understand and what it understood but never drove, because an analysis that
 *   can omit its own blind spots reads as complete when it isn't. They are separate channels because
 *   they name different debts — a dark spot is syntax ASSAYER never parsed; an undriven entry is
 *   parsed perfectly and simply out of the runner's reach (a module scope, a private helper). Only
 *   `functions` are entries; both admissions ride beside them precisely BECAUSE nothing drives them.
 *
 * USAGE:
 * fileAnalysisContract.parse({ functions: [], enrichment: [], darkSpots: [], undriven: [] });
 * // Returns a validated FileAnalysis (branded fields)
 */
import { z } from 'zod';

import { darkSpotContract } from '../dark-spot/dark-spot-contract';
import { functionAnalysisContract } from '../function-analysis/function-analysis-contract';
import { lineEnrichmentContract } from '../line-enrichment/line-enrichment-contract';
import { undrivenEntryContract } from '../undriven-entry/undriven-entry-contract';

export const fileAnalysisContract = z.object({
  functions: z.array(functionAnalysisContract),
  enrichment: z.array(lineEnrichmentContract),
  darkSpots: z.array(darkSpotContract),
  undriven: z.array(undrivenEntryContract),
});

export type FileAnalysis = z.infer<typeof fileAnalysisContract>;
