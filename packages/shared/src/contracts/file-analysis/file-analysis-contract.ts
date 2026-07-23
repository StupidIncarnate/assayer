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
 *   `declaredTypes` carries the file's locally-declared object shapes (name → full property list),
 *   read from the walk's enumerated object descriptors — the source later phases splice per-property
 *   value demands onto. Required for the same reads-as-complete reason: a file states the shapes it
 *   owns even when it owns none.
 *
 * USAGE:
 * fileAnalysisContract.parse({ functions: [], enrichment: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [] });
 * // Returns a validated FileAnalysis (branded fields)
 */
import { z } from 'zod';

import { darkSpotContract } from '../dark-spot/dark-spot-contract';
import { declaredTypeContract } from '../declared-type/declared-type-contract';
import { functionAnalysisContract } from '../function-analysis/function-analysis-contract';
import { lineEnrichmentContract } from '../line-enrichment/line-enrichment-contract';
import { lintEntryContract } from '../lint-entry/lint-entry-contract';
import { undrivenEntryContract } from '../undriven-entry/undriven-entry-contract';

export const fileAnalysisContract = z.object({
  functions: z.array(functionAnalysisContract),
  enrichment: z.array(lineEnrichmentContract),
  darkSpots: z.array(darkSpotContract),
  undriven: z.array(undrivenEntryContract),
  // A FOURTH channel: patterns the repo should CHANGE (a private nothing consumes), not admissions
  // that Assayer cannot drive. Required for the same reason the others are — a file that can omit its
  // own lints reads as clean when it is not.
  lints: z.array(lintEntryContract),
  // The file's locally-declared object shapes with their full property lists.
  declaredTypes: z.array(declaredTypeContract),
});

export type FileAnalysis = z.infer<typeof fileAnalysisContract>;
