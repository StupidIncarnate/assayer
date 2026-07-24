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
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';
import { entryLabelContract, fileAnalysisContract, symbolNameContract } from '@assayer/shared/contracts';
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
import { unreachableLintTransformer } from '../../../transformers/unreachable-lint/unreachable-lint-transformer';

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

  // A branching callback driven through a branchless host surface (`items.map((n) => …)`) is NOT its
  // own entry: it cannot be reached without calling the host, so its steering values FUNNEL into the
  // host's own case set. The follower returns those funnel cases keyed by the host's name + declaration
  // line, and they REPLACE the host's plain derived cases here — the host becomes the only entry.
  const funnelByHost = new Map(followed.funnels.map((funnel) => [`${String(funnel.host)}@${String(funnel.hostLine)}`, funnel.cases]));

  // Every walk exit keyed by its coverage ID, so a funnel entry can name the NESTED scope exits its
  // cases thread through — exits that belong to a callback or a returned private, not to the surface
  // itself. Straight off the walk's scope records, so each is a real ExitNode (coverageId + line +
  // guards), never a re-derived line.
  const exitByCoverageId = new Map(
    (walked.success ? walked.scopes : []).flatMap((scope) => scope.exits.map((exit) => [String(exit.coverageId), exit] as const)),
  );

  const functions = [
    ...derived.map(({ fn, result }) => {
      const funnelCases = funnelByHost.get(`${String(fn.entry.name)}@${String(fn.entry.line)}`);
      if (funnelCases === undefined) {
        return { entry: fn.entry, branches: fn.branches, exits: fn.exits, cases: result.cases };
      }

      // A funnel entry's cases reach a nested scope's exit BEFORE the surface's own return, so their
      // `reachesPath` names coverage IDs the surface's own `exits` do not. A surface that renders a case
      // by a path element resolves its line off this list, so a funnel entry's `exits` are its OWN exits
      // unioned with every walk exit its funnel cases path through (deduped by coverage ID). This is the
      // analysis twin of the path-exit union `case-set-projection` adds to `exitIds` for the interpreter.
      const exits = [
        ...new Map([
          ...fn.exits.map((exit) => [String(exit.coverageId), exit] as const),
          ...funnelCases.flatMap((testCase) =>
            testCase.reachesPath.flatMap((coverageId) => {
              const exit = exitByCoverageId.get(String(coverageId));
              return exit === undefined ? [] : [[String(coverageId), exit] as const];
            }),
          ),
        ]).values(),
      ];

      return { entry: fn.entry, branches: fn.branches, exits, cases: funnelCases };
    }),
    ...followed.followedEntries,
  ];

  // An exit whose guards contradict each other is dead code, and dead code is the REPO's debt — the
  // same channel and the same reasoning as an unconsumed private. The message names both the dead line
  // and the guards that killed it, because "unreachable" alone leaves the reader hunting for which
  // comparison to fix.
  // A MODULE scope is wholly undriven only when derive-cases could neither drive nor evaluate it — no
  // cases, no unreachable exits, and its branching all admitted undriven. Deferring to derive-cases
  // keeps the drivability decision in ONE place (§5.12): a welded-const module scope now EVALUATES (a
  // live case plus an unreachable exit) rather than being blanket-admitted, so only a genuinely opaque
  // operand (a call result, an import, a computed const) still reads as a whole-scope undriven here.
  // Its per-branch admissions would double-count it, so they are suppressed against the projection's
  // names below. A NAMED entry the projection never claims keeps its per-branch admissions — an opaque
  // `if (g())` or a non-param local `if (u > 5)` names the branch a case cannot steer.
  const whollyUndrivenModuleNames = new Set(
    derived
      .filter(
        ({ fn, result }) =>
          fn.entry.access.kind === 'module' &&
          fn.branches.length > 0 &&
          result.cases.length === 0 &&
          result.unreachableExits.length === 0,
      )
      .map(({ fn }) => String(fn.entry.name)),
  );
  const moduleUndriven = undrivenProjectionTransformer({
    walked,
    undrivenModuleNames: whollyUndrivenModuleNames,
    ...(relPath === undefined ? {} : { relPath }),
  });
  const moduleUndrivenNames = new Set(moduleUndriven.map((entry) => String(entry.name)));

  const branchUndriven = derived.flatMap(({ fn, result }) =>
    moduleUndrivenNames.has(String(fn.entry.name))
      ? []
      : undrivenBranchTransformer({ entryName: fn.entry.name, undrivenBranches: result.undrivenBranches }),
  );

  // A module scope's lint reads by its LABEL, never the internal `*module*`: the reader meets the file
  // basename (or its single export), exactly as the undriven admission does. A named entry keeps its
  // own name. The lint's `name` field still keys on `fn.entry.name` for the driven/undriven match.
  const unreachableLints = derived.flatMap(({ fn, result }) => {
    const displayName =
      fn.entry.access.kind === 'module' && relPath !== undefined
        ? moduleEntryLabelTransformer({ ...(fn.entry.exportName === undefined ? {} : { exportName: fn.entry.exportName }), relPath })
        : entryLabelContract.parse(String(fn.entry.name));

    return unreachableLintTransformer({ name: fn.entry.name, displayName, unreachableExits: result.unreachableExits });
  });

  // A FOLLOWED entry's dead exits ride the same channel: a caller welding a literal into a private's
  // call (`report(){ return decide(3) }`) kills the arm that value cannot satisfy, exactly as a welded
  // `const` does in the scope's own source. A `through-caller` private reads by its OWN name; a
  // module-load IIFE (`((n) => …)(7)`) reads by the file's LABEL and keys under `*module*`, never the
  // arrow's structural name — exactly as the scope's own welded const does.
  const followedUnreachableLints = followed.unreachable.flatMap(({ name, label, access, unreachableExits }) => {
    const isModule = access.kind === 'module';

    return unreachableLintTransformer({
      name: isModule ? symbolNameContract.parse('*module*') : name,
      displayName:
        isModule && relPath !== undefined
          ? moduleEntryLabelTransformer({ relPath })
          : label ?? entryLabelContract.parse(String(name)),
      unreachableExits,
    });
  });

  // A NAMED-CALL funnel's welded-dead arm rides the lint channel too: `report(){ return decide(3) }`
  // welds `3` into `decide`, killing the arm that value cannot satisfy exactly as the through-caller
  // path does — but `decide` is no longer a separate entry, so the lint keys on the SURFACE that owns it
  // (`report`) while the message names where the dead code lives (`decide`, on its own line).
  const funnelUnreachableLints = followed.funnels.flatMap((funnel) =>
    funnel.unreachable.flatMap((entry) =>
      unreachableLintTransformer({
        name: funnel.host,
        displayName: entryLabelContract.parse(String(entry.displayName)),
        unreachableExits: [{ line: entry.line, guardLines: entry.guardLines, ...(entry.welded === undefined ? {} : { welded: entry.welded }) }],
      }),
    ),
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
    // from the guard arithmetic, whether the guard is welded in the scope's own source or in a caller's
    // argument. All are the repo's debt rather than Assayer's, so all ride the lint channel rather than
    // any of the three admissions.
    lints: [...followed.lints, ...unreachableLints, ...followedUnreachableLints, ...funnelUnreachableLints],
    // The file's locally-declared object shapes, read straight from the walk's enumerated object
    // descriptors — the full property list later phases splice per-property value demands onto.
    declaredTypes: declaredTypesProjectionTransformer({ walked }),
  });
};
