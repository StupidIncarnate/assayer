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
 *   - an instance `method` whose class needs constructor arguments is driven on an instance built from
 *     those arguments, which the entry carries as `construct`. They are filled from the constructor's declared
 *     parameter types by the same seam that fills any parameter. When one is refused, or the class's
 *     constructor was never analysed, the method is admitted in `undriven` and named, never dropped
 *     and never driven on a guess. It is not a gap, because no harness key reaches a constructor
 *     argument of an instance method today. A `static` method needs no instance, so it is drivable
 *     whatever its class's constructor takes;
 *   - everything else is drivable, and the runner resolves it through its access. A `constructor` is
 *     drivable too: the runner constructs the class with the case's arguments. A constructor whose
 *     argument no value can be built for derives no case, so the analysis already reports it as an
 *     input gap.
 *
 *   Naming an instance method nothing can build, rather than driving it, is the whole point. Handing
 *   it to the runner produces a FAILING case against correct code, which reads as the analyzer being
 *   wrong; a named admission reads as the truth.
 *
 *   `gaps` is the analysis's own channel — an entry whose declared INPUT no value can be built for —
 *   carried as it is. Recomputing it here would ask this transformer to re-run the fill seam, and a run
 *   whose gaps disagreed with the file's own analysis would be two answers to one question.
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
 *   The undriven channel also gains the instance methods named above, beside the analysis's own.
 *   Dropping any of them is how a run over an unfollowed loop comes to print a clean pass.
 *
 * USAGE:
 * caseSetProjectionTransformer({ analysis, relPath, modulePath });
 * // Returns { relPath, modulePath, entries: [{ name, access, exitIds, cases }], gaps: [...], darkSpots: [...], undriven: [...] }
 */
import { caseSetContract } from '../../contracts/case-set/case-set-contract';
import type { CaseSet } from '../../contracts/case-set/case-set-contract';
import type { FileAnalysis } from '@assayer/shared/contracts';

import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { undrivenInstanceLayerTransformer } from './undriven-instance-layer-transformer';

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

  // An instance method of a class whose constructor needs arguments runs on an instance built from
  // those arguments, filled by the same seam that fills any parameter. It is driven when every argument
  // fills, and admitted as undriven when one is refused or the constructor was never analysed.
  const instanceMethods = owed.flatMap((fn) => {
    const { access } = fn.entry;

    if (access.kind !== 'method' || access.constructable || access.static === true) {
      return [];
    }

    const ctorEntry = analysis.functions.find(
      (candidate) => candidate.entry.access.kind === 'constructor' && candidate.entry.access.className === access.className,
    );
    const filled =
      ctorEntry === undefined
        ? undefined
        : appliedParamsTransformer({ params: ctorEntry.entry.params }).map((param) => fillParamTransformer({ param }));

    return [{ fn, className: String(access.className), filled }];
  });
  const stuck = instanceMethods.filter(({ filled }) => filled === undefined || filled.some((result) => result.kind === 'unfillable'));
  const constructFor = new Map(
    instanceMethods
      .filter((method) => !stuck.includes(method))
      .map(({ fn, filled }) => [fn, (filled ?? []).flatMap((result) => (result.kind === 'filled' ? [result.binding] : []))] as const),
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
      .filter((fn) => !stuck.some((method) => method.fn === fn))
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
        ...(constructFor.has(fn) ? { construct: constructFor.get(fn) } : {}),
      })),
    // The analysis already invoiced every entry whose declared INPUT no value can be built for — a
    // fact about the file, true before anything ran. A harness closes each of those.
    gaps: analysis.gaps,
    darkSpots: analysis.darkSpots,
    // The analysis's own undriven entries, then the instance methods whose constructor arguments could
    // not be built. Those are Assayer's debt, not a gap: no harness key reaches a constructor argument
    // of an instance method yet.
    undriven: [
      ...analysis.undriven,
      ...stuck.map(({ fn, className, filled }) =>
        undrivenInstanceLayerTransformer({
          fn,
          className,
          refused: (filled ?? []).flatMap((result) =>
            result.kind === 'unfillable' ? [{ param: String(result.param), type: String(result.type) }] : [],
          ),
        }),
      ),
    ],
    lints: analysis.lints,
  });
};
