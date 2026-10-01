/**
 * PURPOSE: Drives an inline callback's branches THROUGH the entry that maps it over an array param —
 *   the array/element twin of `through-caller-cases`. A callback passed to `items.map((n) => …)` binds
 *   its FIRST parameter to the array element, so steering that element steers the callback: derive the
 *   callback's OWN cases over its element param (P4 — the asserted exit is the callback's own predicate,
 *   never a recorded output), then lay each steered element value into the entry's array param as a
 *   single-element array. Every other entry parameter goes through the shared fill seam so the entry
 *   stays callable, exactly as an unconstrained parameter is filled anywhere else — and a case whose
 *   entry has a param the seam REFUSES is dropped, because the entry cannot be called at all.
 *
 *   A branchless callback (`items.filter((n) => n > 5)`) has no `if` — its true/false split rides the
 *   RETURN comparison, published as `predicateSignature` — so it is threaded into the callback's own
 *   derivation exactly as every other driving route threads it, and carried onto the entry the analysis
 *   returns so a reader re-deriving from it sees the same axis. Skipping this collapses `.filter`/
 *   `.some`/`.every`/`.find` callbacks to one representative element, proving neither side of the split.
 *
 *   The entry keeps the callback's identity — its name, scope path, and exit ids — so coverage attaches
 *   where the logic lives; only its ACCESS becomes `through-caller`, naming the entry the runner drives.
 *   The callback is never invoked directly; the runner calls the entry with the steered array and the
 *   entry's own `.map` reaches the callback, exactly as a private is reached through its caller.
 *
 *   That identity is a structural PROJECTION, since an inline callback has no name to borrow — so the
 *   caller hands in the display `label` alongside it. Without one a surface has nothing to print but the
 *   projection, which is a cache key.
 *
 *   The CALLBACK's own refusals ride back on `unfillable`, tagged with that display label as their
 *   owner, so a callback whose element Assayer cannot construct is invoiced against the entry the runner
 *   drives rather than derived away in silence. The ENTRY's refusals are not repeated here: the entry is
 *   an entry in its own right and its own derivation already invoices them.
 *
 * USAGE:
 * throughCallbackCasesTransformer({ callback, entry, arrayParam: 'items', label: 'rescale › items.map((n) => …) L2' });
 * // Returns { analysis: FunctionAnalysis (entry.access { kind: 'through-caller', callerName }),
 * //   unfillable: [{ param, type, owner }, …] }
 */
import {
  arrangeValueContract,
  derivedTestCaseContract,
  entryAccessContract,
  entryLabelContract,
  functionAnalysisContract,
} from '@assayer/shared/contracts';
import type { ArrangeBinding, ArrangeValue, EntryLabel, FunctionAnalysis, TypeText } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { isValueBindingGuard } from '../../guards/is-value-binding/is-value-binding-guard';
import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { deriveCasesRequestTransformer } from '../derive-cases-request/derive-cases-request-transformer';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';

export const throughCallbackCasesTransformer = ({
  callback,
  entry,
  arrayParam,
  label,
}: {
  callback: ScopeRecord;
  entry: ScopeRecord;
  arrayParam: string;
  label?: EntryLabel;
}): { analysis: FunctionAnalysis; unfillable: { param: string; type: TypeText; owner: EntryLabel }[] } => {
  // The callback's first parameter is the one bound to the array element; its steered value is the
  // array's single element. The callback's branches are derived over it exactly as a scalar param.
  const elementParamName = callback.params[0]?.name;

  // The entry parameters a call supplies, in declaration order because the interpreter applies them
  // positionally — a trailing one no caller owes and the seam cannot build is not part of the call.
  const entryParams = appliedParamsTransformer({ params: entry.params });

  const derived = deriveCasesTransformer(
    deriveCasesRequestTransformer({
      scope: callback,
      params: callback.params,
      // A callback's element comes from iterating the entry's array, never from a call argument, so
      // there is no weld map to compute here — nothing ever welds a value into a callback's parameter.
      welds: undefined,
      envDrivable: false,
      // No harness route reaches a callback: its steered value is an ArrangeValue nested inside the
      // entry's array binding, and ArrangeValue has no `harness` arm the way ArrangeBinding does — there
      // is no slot to bind a key path onto (see `derive-cases-request`'s PURPOSE).
      harness: undefined,
    }),
  );

  const cases = derived.cases.flatMap((testCase) => {
    // The element binding may be a scalar `param`, or a composite `array`/`object` when the array's
    // element type is itself an array or an object (`matrix.map((row) => …)`, `items.map((item, idx) =>
    // …)` with an object element) — `isValueBindingGuard` is the one place that recognizes every
    // value-carrying arm, so a nested-array or object element steers the same as a scalar one instead of
    // silently reading as absent and running the callback zero times. TypeScript cannot narrow a
    // destructured guard parameter (TS1230), so the kind check is restated here to type the match —
    // `isValueBindingGuard` stays the one place the RULE is decided, this only satisfies the compiler.
    const elementBinding = testCase.arrange.find(
      (binding): binding is Extract<ArrangeBinding, { kind: 'param' } | { kind: 'array' } | { kind: 'object' }> => {
        if (binding.kind !== 'param' && binding.kind !== 'array' && binding.kind !== 'object') {
          return false;
        }

        return (
          isValueBindingGuard({ binding }) && elementParamName !== undefined && String(binding.param) === String(elementParamName)
        );
      },
    );
    // A one-element array carrying the steered element. An empty array runs the callback zero times, so
    // the element that steers the branch must actually be present. Re-parsed through the SAME recursive
    // contract the binding's own `value` field already satisfies — an `object` binding's zod-inferred
    // record type is not structurally an `ArrangeValue` on its own, even though every value it ever
    // holds is one (the same re-parse `cause-arrange-transformer` does for the identical reason).
    const element: ArrangeValue[] = elementBinding === undefined ? [] : [arrangeValueContract.parse(elementBinding.value)];

    // The array param the callback iterates carries the steered one-element list; every OTHER param is
    // unsteered and filled through the seam — which can REFUSE, and then the entry cannot be called at
    // all, so the case is dropped rather than built on a placeholder.
    const arrange = entryParams.flatMap((param): ArrangeBinding[] => {
      // A REST param's array carries `rest: true`, so the interpreter SPREADS it across the tail
      // positional slots the entry's `.map` steers instead of handing it over as one argument.
      if (String(param.name) === String(arrayParam)) {
        return [{ kind: 'array', param: param.name, value: element, ...(param.rest === true ? { rest: true } : {}) }];
      }

      const fill = fillParamTransformer({ param });

      return fill.kind === 'filled' ? [fill.binding] : [];
    });

    return arrange.length === entryParams.length
      ? [derivedTestCaseContract.parse({ reachesPath: testCase.reachesPath, salient: testCase.salient, arrange })]
      : [];
  });

  return {
    analysis: functionAnalysisContract.parse({
      entry: {
        name: callback.name,
        ...(label === undefined ? {} : { label }),
        scopePath: callback.scopePath,
        params: callback.params,
        returnType: callback.returnType,
        line: callback.startLine,
        access: entryAccessContract.parse({ kind: 'through-caller', callerName: entry.name }),
      },
      branches: callback.branches,
      exits: callback.exits,
      cases,
      // The callback's own return comparison, carried onto the entry it becomes: this IS the callback, so
      // a reader re-deriving from the analysis sees the axis its cases were derived with.
      ...(callback.predicateSignature === undefined ? {} : { predicateSignature: callback.predicateSignature }),
    }),
    // Owned by the callback, invoiced against the entry: the label is the only handle a reader has on an
    // inline scope, and a named one shows its own name.
    unfillable: derived.unfillable.map((refusal) => ({
      ...refusal,
      owner: label ?? entryLabelContract.parse(String(callback.name)),
    })),
  };
};
