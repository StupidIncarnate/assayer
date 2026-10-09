/**
 * PURPOSE: Projects a file's analysis into the RUNNABLE case set — the entries a test can actually
 *   drive, plus the named gaps it cannot, plus what it understood and never drove.
 *
 *   The split is the interesting part, and it is policy rather than fact, which is why it lives here
 *   and not in the walk. But WHETHER an entry is drivable is decided upstream by `derive-cases` and
 *   read off ONE fact here — did it produce cases (§5.12) — never re-derived per access kind:
 *   - `unreachable` (an unexported helper) is never runnable directly, so it is filtered out — but it
 *     is not silent either: the analysis already admitted it in `undriven`, carried through below;
 *   - a `module` scope earns cases three ways, all resolved before it reaches here: the environment
 *     gives its branching something to vary (a case writes the variables and imports it fresh); a
 *     welded constant is EVALUATED to its live arm (the dead arm rides `unreachable-exit`, so there is
 *     exactly one real case, never two claiming different exits); or it is a branchless CONSUMPTION
 *     site (it calls an import or an ambient global — the only other reason a module becomes an entry —
 *     so importing it runs the call and its one happy-path case reaches the module's single exit). A
 *     module whose branch turns on an OPAQUE operand earns no case at all, so it is admitted in
 *     `undriven` instead of dropped silently;
 *   - an instance `method` whose class needs constructor arguments IS a gap: something real is untested
 *     and needs a harness, so it is named rather than dropped. A `static` method needs no instance, so
 *     it is drivable whatever its class's constructor takes;
 *   - everything else is drivable, and the runner resolves it through its access. A `constructor` is
 *     drivable too: the runner constructs the class with the case's arguments. A constructor whose
 *     argument no value can be built for derives no case, so the analysis already reports it as an
 *     input gap.
 *
 *   Reporting the gap rather than driving it is the whole point. Handing an unconstructable entry to
 *   the runner produces a FAILING case against correct code, which reads as the analyzer being
 *   wrong; a named gap reads as the truth — nobody has said how to build this yet.
 *
 *   The ACCESS gaps computed here are only half the channel. The analysis carries the other half — an
 *   entry whose declared INPUT no value can be built for — and the two CONCATENATE: one channel, two
 *   producers, one shape, because the reader owes the same act for both. Recomputing the input half
 *   here would ask this transformer to re-run the fill seam, and a run whose gaps disagreed with the
 *   file's own analysis would be two answers to one question.
 *
 *   `harnessPath` is named only when some case actually carries a HARNESS binding. The caller offers the
 *   path a colocated harness WOULD have — it is a pure function of the source path — and this decides
 *   whether the run has any reason to load it. Naming it unconditionally would tell every shim in the
 *   repo to require a file that is not there; deciding it from the bindings makes "the case set names a
 *   harness" and "some case needs one" the same fact rather than two that can drift.
 *
 *   Dark spots and undriven entries are carried straight through, unfiltered, and neither is ever
 *   folded into `gaps` or into each other. Three admissions, three debts: a gap is the caller's
 *   (understood, not constructable — write a harness), a dark spot is ASSAYER's (syntax it never
 *   understood, which no harness can fix), and an undriven entry is understood perfectly but beyond
 *   the runner's reach (which no harness can fix either, and which the analyzer was never blind to).
 *   Dropping any of them is how a run over an unfollowed loop comes to print a clean pass.
 *
 * USAGE:
 * caseSetProjectionTransformer({ analysis, relPath, modulePath });
 * // Returns { relPath, modulePath, entries: [{ name, access, exitIds, cases }], gaps: [...], darkSpots: [...], undriven: [...] }
 */
import { caseSetContract } from '../../contracts/case-set/case-set-contract';
import type { CaseSet } from '../../contracts/case-set/case-set-contract';
import type { FileAnalysis } from '@assayer/shared/contracts';

export const caseSetProjectionTransformer = ({
  analysis,
  relPath,
  modulePath,
  harnessPath,
}: {
  analysis: FileAnalysis;
  relPath: string;
  modulePath: string;
  harnessPath?: string | undefined;
}): CaseSet => {
  // An entry is runnable iff it produced cases — that ONE fact decides it, because `derive-cases` has
  // already resolved drivability (§5.12). A module scope is no exception: it earns cases when the
  // environment gives its branching something to vary, when a welded constant is EVALUATED to its live
  // arm (the dead arm rides `unreachable-exit`, never a bogus second case), or when it is a branchless
  // CONSUMPTION site whose single import/global call reaches its one exit. A module whose branch turns
  // on an opaque operand earns no case at all and is admitted in `undriven` instead.
  const owed = analysis.functions.filter((fn) => fn.entry.access.kind !== 'unreachable' && fn.cases.length > 0);
  const blocked = owed.filter(
    (fn) => fn.entry.access.kind === 'method' && !fn.entry.access.constructable && fn.entry.access.static !== true,
  );

  // The run loads a harness only when a case actually reaches for one — a supplied input is the only
  // reason the file has to be read at all.
  const suppliesInputs = owed.some((fn) =>
    fn.cases.some((testCase) => testCase.arrange.some((binding) => binding.kind === 'harness')),
  );

  return caseSetContract.parse({
    relPath,
    modulePath,
    ...(harnessPath === undefined || !suppliesInputs ? {} : { harnessPath }),
    entries: owed
      .filter((fn) => !blocked.includes(fn))
      .map((fn) => ({
        name: fn.entry.name,
        access: fn.entry.access,
        // The exits the interpreter observes for this entry: its OWN exits, plus every exit its cases
        // path through. A FUNNEL entry's cases reach a private's (or callback's) exit before the
        // surface's own return, so those exits must be observable here — otherwise the interpreter
        // filters them out and the multi-exit path can never match. A non-funnel case's `reachesPath` is
        // a subset of the entry's exits, so this adds nothing; a callback the entry merely SCHEDULES
        // (not funnelled, so in no case's path) is still excluded, which is the filter's whole point.
        exitIds: [...new Set([...fn.exits.map((exit) => exit.coverageId), ...fn.cases.flatMap((testCase) => testCase.reachesPath)])],
        cases: fn.cases,
      })),
    // ONE channel, TWO producers. The analysis already invoiced every entry whose declared INPUT no
    // value can be built for — a fact about the file, true before anything ran — and this adds the ones
    // whose ACCESS the runner cannot reach through. Both are the caller's debt, closed by the same act,
    // so they concatenate rather than living in two lists a reader would have to merge. The analysis
    // gaps come first because they were true first.
    gaps: [
      ...analysis.gaps,
      ...blocked.map((fn) => ({
        name: fn.entry.name,
        reason: 'its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
      })),
    ],
    darkSpots: analysis.darkSpots,
    undriven: analysis.undriven,
    lints: analysis.lints,
  });
};
