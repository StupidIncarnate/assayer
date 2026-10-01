/**
 * PURPOSE: Contract for a file analysis — the per-file analysis model carried alongside the raw
 *   map: every analyzed entry's function analysis, the per-line enrichment facts, the dark spots the
 *   walk could not follow, and the logic it read but cannot drive. Threads from the cache blob
 *   through the desktop bridge into the detail-view enrichment and tests panels.
 *
 *   `gaps`, `darkSpots` and `undriven` are all REQUIRED, not optional: a file analysis must always
 *   state what it could not construct, what it failed to understand, and what it understood but never
 *   drove, because an analysis that can omit its own blind spots reads as complete when it isn't. They
 *   are separate channels because they name different debts — a gap is the CALLER's (understood, not
 *   constructable, so a harness closes it); a dark spot is syntax ASSAYER never parsed; an undriven
 *   entry is parsed perfectly and simply out of the runner's reach (a module scope, a private helper).
 *   Only `functions` are entries; the admissions ride beside them precisely BECAUSE nothing drives them.
 *
 *   `gaps` rides the ANALYSIS and not merely the run artifact, because the reads-as-complete lie lives
 *   in the analysis: a file admits an input it cannot construct the moment it is opened, before
 *   anything runs. The run's own `gaps` is this channel plus the access-shaped gaps the case-set
 *   projection adds — one channel, two producers, the same `{name, reason}` shape.
 *
 *   `declaredTypes` carries the file's locally-declared object shapes (name → full property list),
 *   read from the walk's enumerated object descriptors — the source later phases splice per-property
 *   value demands onto. Required for the same reads-as-complete reason: a file states the shapes it
 *   owns even when it owns none.
 *
 *   `declaringScopes` names every same-file PRIVATE or CALLBACK a driving route folded into a host
 *   entry rather than projecting as an entry of its own — a funnelled private a branchless surface
 *   returns, or an inline callback funnelled over an array param. It is the ONE source `harness-validate`
 *   and the harness-realize overlay both read for a scope an input-gap invoice can name (`on 'build'`)
 *   but `functions` does not carry, so the two can never disagree about what a driving route folded in.
 *   REQUIRED, for the same reads-as-complete reason as `gaps`/`darkSpots`/`undriven`: a file states which
 *   scopes it folded even when it folded none.
 *
 * USAGE:
 * fileAnalysisContract.parse({ functions: [], enrichment: [], gaps: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [] });
 * // Returns a validated FileAnalysis (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { darkSpotContract } from '../dark-spot/dark-spot-contract';
import { declaredTypeContract } from '../declared-type/declared-type-contract';
import { declaringScopeContract } from '../declaring-scope/declaring-scope-contract';
import { entryGapContract } from '../entry-gap/entry-gap-contract';
import { functionAnalysisContract } from '../function-analysis/function-analysis-contract';
import { lineEnrichmentContract } from '../line-enrichment/line-enrichment-contract';
import { lintEntryContract } from '../lint-entry/lint-entry-contract';
import { undrivenEntryContract } from '../undriven-entry/undriven-entry-contract';

export const fileAnalysisContract = z.object({
  functions: z.array(functionAnalysisContract),
  enrichment: z.array(lineEnrichmentContract),
  gaps: z.array(entryGapContract),
  darkSpots: z.array(darkSpotContract),
  undriven: z.array(undrivenEntryContract),
  // A FOURTH channel: patterns the repo should CHANGE (a private nothing consumes), not admissions
  // that Assayer cannot drive. Required for the same reason the others are — a file that can omit its
  // own lints reads as clean when it is not.
  lints: z.array(lintEntryContract),
  // The file's locally-declared object shapes with their full property lists.
  declaredTypes: z.array(declaredTypeContract),
  // Same-file scopes a driving route folded into one of `functions` — see PURPOSE above.
  declaringScopes: z.array(declaringScopeContract),
});

export type FileAnalysis = z.infer<typeof fileAnalysisContract>;
