/**
 * PURPOSE: Turns a walked file into its FileAnalysis — projecting the entries, deriving the full
 *   input-bucket case set per entry (one case per distinguished input combination, each marked
 *   `salient` or grayed), building the per-line enrichment (each param's type on the entry line; each
 *   branch operand's type + representative value range on the branch line), and carrying through both
 *   of the walk's admissions: the dark spots it could not follow, and the branching scopes it read
 *   perfectly but nothing can drive.
 *
 *   Both admissions are projected from the WALK, not from the entries above them, because the entries
 *   are where those scopes stop — a private helper is never projected as one, so there is nothing
 *   there to filter and no way to notice it is gone.
 *
 *   It takes the WALK rather than source on purpose: the compile pipeline already walked the file to
 *   build its map, and parsing a second time here is what the single-parse seam exists to avoid.
 *   Returns an empty analysis when the source failed to parse — the pipeline already reports the
 *   syntax error from the same walk.
 *
 * USAGE:
 * analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });
 * // Returns a validated FileAnalysis: { functions: [...], enrichment: [...], darkSpots: [...], undriven: [...] }
 */
import { fileAnalysisContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { analysisProjectionTransformer } from '../../../transformers/analysis-projection/analysis-projection-transformer';
import { composePredicatesTransformer } from '../../../transformers/compose-predicates/compose-predicates-transformer';
import { darkSpotProjectionTransformer } from '../../../transformers/dark-spot-projection/dark-spot-projection-transformer';
import { declaredTypesProjectionTransformer } from '../../../transformers/declared-types-projection/declared-types-projection-transformer';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { fileEnrichmentTransformer } from '../../../transformers/file-enrichment/file-enrichment-transformer';
import { followCallsTransformer } from '../../../transformers/follow-calls/follow-calls-transformer';
import { undrivenBranchTransformer } from '../../../transformers/undriven-branch/undriven-branch-transformer';
import { undrivenProjectionTransformer } from '../../../transformers/undriven-projection/undriven-projection-transformer';

export const analyzeFileBroker = ({ walked, relPath }: { walked: WalkFileResult; relPath?: string }): FileAnalysis => {
  const extracted = analysisProjectionTransformer({ walked });

  if (!extracted.success) {
    return fileAnalysisContract.parse({ functions: [], enrichment: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [] });
  }

  // A caller's opaque `if (helper(x))` guard is composed with the same-file predicate it calls BEFORE
  // any case is derived: the lone truthy leaf becomes the callee's own comparison rebased onto the
  // caller's argument, so derive-cases and enrichment both read the sound guard, not the opaque one.
  const composed = composePredicatesTransformer({ functions: extracted.functions, walked });

  // Following the call graph is what turns a private helper from an admission into a driven entry:
  // its branches are covered through the reachable caller that passes an input straight in, and the
  // ones no caller can steer stay honestly undriven.
  const followed = followCallsTransformer({ walked });

  const derived = composed.map((fn) => ({
    fn,
    result: deriveCasesTransformer({
      params: fn.entry.params,
      branches: fn.branches,
      exits: fn.exits,
      // Only a module scope is driven BY importing it, which is when its top-level bindings read the
      // environment. A function is driven by calling it, long after its module ran and froze them.
      envDrivable: fn.entry.access.kind === 'module',
      // A branchless boolean predicate (`function tooBig(n){ return n > 50 }`) carries its return
      // comparison here so derive-cases splits its true/false return into two salient cases.
      ...(fn.predicateSignature === undefined ? {} : { returnPredicate: fn.predicateSignature }),
    }),
  }));

  const functions = [
    ...derived.map(({ fn, result }) => ({
      entry: fn.entry,
      branches: fn.branches,
      exits: fn.exits,
      cases: result.cases,
    })),
    ...followed.followedEntries,
  ];

  // An exit whose guards contradict each other is dead code, and dead code is the REPO's debt — the
  // same channel and the same reasoning as an unconsumed private. The message names both the dead line
  // and the guards that killed it, because "unreachable" alone leaves the reader hunting for which
  // comparison to fix.
  // A module scope whose top-level branching is all welded is admitted whole by the projection below;
  // its per-branch admissions would double-count it, so they are suppressed against that projection's
  // names. A NAMED entry the projection never claims keeps its per-branch admissions — an opaque
  // `if (g())` or a non-param local `if (u > 5)` names the branch a case cannot steer.
  const moduleUndriven = undrivenProjectionTransformer({ walked, ...(relPath === undefined ? {} : { relPath }) });
  const moduleUndrivenNames = new Set(moduleUndriven.map((entry) => String(entry.name)));

  const branchUndriven = derived.flatMap(({ fn, result }) =>
    moduleUndrivenNames.has(String(fn.entry.name))
      ? []
      : undrivenBranchTransformer({ entryName: fn.entry.name, undrivenBranches: result.undrivenBranches }),
  );

  const unreachableLints = derived.flatMap(({ fn, result }) =>
    result.unreachableExits.map((unreachable) => ({
      rule: 'unreachable-exit',
      name: fn.entry.name,
      message: `\`${String(fn.entry.name)}\` can never reach the exit on line ${String(unreachable.line)}: the guards on ${unreachable.guardLines.length === 1 ? 'line' : 'lines'} ${unreachable.guardLines.map((line) => String(line)).join(', ')} cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.`,
      startLine: unreachable.line,
      endLine: unreachable.line,
    })),
  );

  // Enrichment shows each param's type on the entry line and, once per branch LEAF, that operand's
  // type + representative range on the branch line — derived from the COMPOSED functions, so a
  // rebased call-guard enriches its real comparison, not the opaque one.
  const enrichment = fileEnrichmentTransformer({ functions: composed });

  return fileAnalysisContract.parse({
    functions,
    enrichment,
    darkSpots: darkSpotProjectionTransformer({ walked }),
    // Three sources feed the one channel: the whole welded MODULE scope from the walk, the fixed-arg
    // PRIVATE from the call graph, and the un-steerable BRANCH from the derivation. Separate questions,
    // separate owners, never merged.
    undriven: [...moduleUndriven, ...followed.undriven, ...branchUndriven],
    // Dead surface — a private nothing consumes — comes from the call graph; an unreachable exit comes
    // from the guard arithmetic. Both are the repo's debt rather than Assayer's, so both ride the lint
    // channel rather than any of the three admissions.
    lints: [...followed.lints, ...unreachableLints],
    // The file's locally-declared object shapes, read straight from the walk's enumerated object
    // descriptors — the full property list later phases splice per-property value demands onto.
    declaredTypes: declaredTypesProjectionTransformer({ walked }),
  });
};
