/**
 * PURPOSE: Folds the BRANCHING inline callbacks a host surface maps over its array params UP into the
 *   host's own case set, so the surface is the ONLY entry the file offers. A callback passed to
 *   `items.map((n) => …)` cannot be reached without calling the surface, so its steering values must
 *   FUNNEL into the surface's own cases rather than stand as a separate `through-caller` entry: the
 *   surface's cases become the array shapes that drive the callbacks, and each case predicts the ordered
 *   PATH the flow reaches — each callback's own exit(s), in the order the callbacks fire, then the
 *   surface's return.
 *
 *   Each callback contributes the SAME three array shapes it would alone:
 *   - EMPTY — the array is `[]`, so the callback runs zero times and adds no exit to the path.
 *   - SINGLE — one shape per element value the callback's branches distinguish, reusing the per-element
 *     cases `through-callback-cases` derives (P4 — each element is an INPUT, the predicted exit the
 *     callback's own predicate). Its sub-path is the callback's own exit path.
 *   - MULTIPLE — an arm-crossing pair of the first two distinguished elements in one array, so the
 *     callback fires once per element. Its sub-path is both callback exits, once each.
 *
 *   The surface's funnel is the CARTESIAN of every callback's contributions: the callbacks fire over
 *   INDEPENDENT array params, so every pairing of their shapes is a distinct input to the surface, and
 *   steering `xs` into one callback's arm while steering `ys` into another is the interesting
 *   combination. For a SINGLE callback the cartesian is just that callback's own funnel (empty, one per
 *   distinguished element, and the pair); for N it is the product, ordered by the callbacks' fire order
 *   (source order, earlier-declared outermost). Each cartesian case's arrange sets EVERY steered array
 *   param and fills the rest, and its path concatenates each callback's sub-path in fire order, tailed by
 *   the surface's own exit.
 *
 *   It composes existing pieces: `through-callback-cases` for the element values + callback exits,
 *   `fill-param` for every surface param no callback steers, and simple path concatenation with the
 *   surface's own exit. The surface is assumed BRANCHLESS with a single exit — the caller gates on that
 *   (a branching surface is a later increment) — so `surface.exits[0]` is the funnel's tail.
 *
 *   Each folded callback's own refusals ride back on `unfillable`, tagged with that callback as their
 *   owner: the surface is the ONLY entry once a callback funnels into it, so a callback element Assayer
 *   cannot construct must be invoiced against the surface or it is invoiced nowhere. The SURFACE's own
 *   refusals are not repeated — it is an entry in its own right and its own derivation invoices them.
 *
 * USAGE:
 * funnelCasesTransformer({ surface: pipeline, callbacks: [{ callback: cbA, arrayParam: 'xs' }, { callback: cbB, arrayParam: 'ys' }] });
 * // Returns { cases, unfillable } — the cartesian of each callback's empty/single/pair shapes, plus what they refused.
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { ArrangeBinding, ArrangeValue, DerivedTestCase, EntryLabel, TypeText, Coverage } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { throughCallbackCasesTransformer } from '../through-callback-cases/through-callback-cases-transformer';

export const funnelCasesTransformer = ({
  surface,
  callbacks,
}: {
  surface: ScopeRecord;
  callbacks: { callback: ScopeRecord; arrayParam: string; label?: EntryLabel | undefined }[];
}): { cases: DerivedTestCase[]; unfillable: { param: string; type: TypeText; owner: EntryLabel }[] } => {
  // The surface is branchless with a single exit (the caller gates on that); its one exit is the tail
  // every funnel path returns through.
  const surfaceExit = surface.exits[0]?.coverageId;
  if (surfaceExit === undefined || callbacks.length === 0) {
    return { cases: [], unfillable: [] };
  }

  // The callbacks fire in source order — each `const scaled = xs.map(…)` evaluates top-to-bottom, so the
  // callback declared earlier reaches its exits first. Sorting by start line fixes the deterministic fire
  // order the funnel paths thread in and the cartesian's significance order (earliest outermost).
  const ordered = [...callbacks].sort((left, right) => Number(left.callback.startLine) - Number(right.callback.startLine));

  // The surface parameters a call supplies, in declaration order because the interpreter applies them
  // positionally — a trailing one no caller owes and the seam cannot build is not part of the call.
  const surfaceParams = appliedParamsTransformer({ params: surface.params });

  // Per callback, the array-shape CONTRIBUTIONS its funnel offers: the empty array (callback runs zero
  // times, no exit), one single-element array per distinguished element (the callback's own exit path),
  // and the arm-crossing pair of the first two (both exits, once each). Each contribution pairs the array
  // VALUE laid into that callback's param with the callback EXIT sub-path it reaches.
  const built = ordered.map(({ callback, arrayParam, label }) =>
    throughCallbackCasesTransformer({ callback, entry: surface, arrayParam, ...(label === undefined ? {} : { label }) }),
  );

  const contributionLists: { arrayParam: string; value: ArrangeValue[]; subPath: Coverage['id'][] }[][] = ordered.map(
    ({ arrayParam }, callbackIndex) => {
      // The callback's own per-element cases — each lays ONE steered element into the array param and
      // predicts the single callback exit that element reaches.
      const perElement = built[callbackIndex]?.analysis.cases ?? [];

      // The steered element list each per-element case laid into the array param — a one-element list.
      const steered = perElement.map((testCase): ArrangeValue[] => {
        const binding = testCase.arrange.find((entry) => entry.kind === 'array' && String(entry.param) === String(arrayParam));
        return binding !== undefined && binding.kind === 'array' ? binding.value : [];
      });

      // The empty array shape for the array param. It holds no element, so no element type is read and
      // it is a correct value for an array of ANY element type — including one the fill seam refuses.
      const emptyValue: ArrangeValue[] = [];

      // The arm-crossing pair — the first two distinguished elements in one array, firing the callback
      // once per element. Absent when the callback distinguishes fewer than two.
      const [firstCase, secondCase] = perElement;
      const multiple =
        firstCase === undefined || secondCase === undefined
          ? []
          : [
              {
                arrayParam,
                value: [...(steered[0] ?? []), ...(steered[1] ?? [])],
                subPath: [...firstCase.reachesPath, ...secondCase.reachesPath],
              },
            ];

      return [
        { arrayParam, value: emptyValue, subPath: [] },
        ...perElement.map((testCase, index) => ({ arrayParam, value: steered[index] ?? [], subPath: testCase.reachesPath })),
        ...multiple,
      ];
    },
  );

  // The cross product: one contribution per callback, in fire order. For a single callback this is just
  // that callback's own funnel; for N it is every combination of the callbacks' array shapes, because the
  // callbacks fire over INDEPENDENT arrays and every pairing is a distinct input to the surface. The seed
  // carries the empty combination so the reduce folds each callback's list onto it in order.
  const seed: { arrayParam: string; value: ArrangeValue[]; subPath: Coverage['id'][] }[][] = [[]];
  const combinations = contributionLists.reduce(
    (acc, list) => acc.flatMap((combo) => list.map((item) => [...combo, item])),
    seed,
  );

  const cases = combinations.flatMap((combo) => {
    // Each combination steers one array param per callback; a surface param no callback steers goes
    // through the shared fill seam so the surface stays callable — a sibling ARRAY param takes a real
    // array, not a scalar that throws — and a param the seam REFUSES drops the case, since a surface
    // that cannot be called derives nothing rather than something built on a placeholder.
    const valueByParam = new Map(combo.map((contribution) => [String(contribution.arrayParam), contribution.value] as const));

    const arrange = surfaceParams.flatMap((param): ArrangeBinding[] => {
      const value = valueByParam.get(String(param.name));

      // A REST param's array carries `rest: true`, so the interpreter SPREADS it across the tail
      // positional slots the funnel steers instead of handing it over as one argument.
      if (value !== undefined) {
        return [{ kind: 'array', param: param.name, value, ...(param.rest === true ? { rest: true } : {}) }];
      }

      const fill = fillParamTransformer({ param });

      return fill.kind === 'filled' ? [fill.binding] : [];
    });

    return arrange.length === surfaceParams.length
      ? [
          derivedTestCaseContract.parse({
            // The callback sub-paths in fire order, tailed by the surface's own exit: each callback fires,
            // then the surface returns. An all-empty combination adds no callback exits, so the path is
            // the surface's exit alone.
            reachesPath: [...combo.flatMap((contribution) => contribution.subPath), surfaceExit],
            salient: true,
            arrange,
          }),
        ]
      : [];
  });

  return { cases, unfillable: built.flatMap((entry) => entry.unfillable) };
};
