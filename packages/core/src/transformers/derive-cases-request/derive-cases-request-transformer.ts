/**
 * PURPOSE: Builds the argument object every driving route hands to `deriveCasesTransformer` — the ONE
 *   place that turns a scope into the engine's request, so a new engine option reaches every caller by
 *   landing here once. Before this existed, `through-caller-cases`, `through-callback-cases`,
 *   `through-invocation-cases` and `funnel-named-cases` each built that argument object by hand, and an
 *   option added to the engine reached only whichever file the author had open. Eight bugs came from
 *   that, tracked in `plan/followups.md` under "Four places build the same request by hand".
 *
 *   `exits` and `returnPredicate` are the same act at every call site, so they are read straight off
 *   `scope` with no per-caller choice: `exits` is `scope.exits`, and `returnPredicate` is
 *   `scope.predicateSignature` when the scope has one. A caller that skipped `returnPredicate` used to be
 *   exactly how a branchless callback like `ns.filter(n => n > 5)` collapsed to one test case instead of
 *   splitting true from false — folding the read in here is what makes that omission impossible to repeat.
 *
 *   Everything else genuinely differs by caller, so it is a REQUIRED key here, never an optional one: a
 *   caller that has nothing to pass for `welds` or `harness` still has to write the key with `undefined`
 *   and say why in a comment, instead of the property just being absent. Four axes:
 *
 *   - `params` — most callers derive over the scope's OWN declared parameters. The one exception is
 *     `through-invocation-cases`: an IIFE runs when the module is imported, not when it is called, so
 *     nothing ever passes it arguments, and it passes `[]` rather than `scope.params`.
 *   - `welds` — a caller that read a WELDED literal out of a call argument (`callArgBindingsTransformer`'s
 *     `weldByParam`) passes that map, which stamps the welded value onto every branch leaf that reads it
 *     (`stampBranchesTransformer`) so the arm it decides EVALUATES instead of being admitted undriven.
 *     `through-callback-cases` passes `undefined`: a callback's element comes from iterating an array, not
 *     from a call argument, so there is no weld map to compute at all.
 *   - `envDrivable` — true only for `through-invocation-cases`, because module-load code reads the
 *     environment as it runs. Every other route derives a scope reached by a normal call, which does not.
 *   - `harness` — closes a refusal by naming the parameters a colocated harness supplies. `through-caller-
 *     cases` and `funnel-named-cases` thread it, because their scope is a real entry (or folds into one)
 *     with a harness key of its own. `through-callback-cases` and `through-invocation-cases` pass
 *     `undefined`: a callback's steered value is an `ArrangeValue` nested inside the entry's array
 *     binding, and `ArrangeValue` has no `harness` arm the way `ArrangeBinding` does — there is no slot to
 *     bind a key path onto — and module-load code has no parameter a harness names in the first place
 *     (its `params` axis is always `[]`).
 *
 * USAGE:
 * deriveCasesTransformer(deriveCasesRequestTransformer({
 *   scope: callee, params: callee.params, welds: weldByParam, envDrivable: false, harness,
 * }));
 * // Returns the exact argument object deriveCasesTransformer takes — { params, branches, exits,
 * //   envDrivable, returnPredicate?, harness? }
 */
import type { ParamDescriptor, RepresentativeValue } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import type { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { stampBranchesTransformer } from '../stamp-branches/stamp-branches-transformer';

export const deriveCasesRequestTransformer = ({
  scope,
  params,
  welds,
  envDrivable,
  harness,
}: {
  scope: ScopeRecord;
  params: ParamDescriptor[];
  welds: Map<string, RepresentativeValue> | undefined;
  envDrivable: boolean;
  harness: { entry: string; params: readonly string[] } | undefined;
}): Parameters<typeof deriveCasesTransformer>[0] => ({
  params,
  branches: welds === undefined ? scope.branches : stampBranchesTransformer({ branches: scope.branches, welds }),
  exits: scope.exits,
  envDrivable,
  ...(scope.predicateSignature === undefined ? {} : { returnPredicate: scope.predicateSignature }),
  ...(harness === undefined ? {} : { harness }),
  ...(scope.indexDemands.length === 0 ? {} : { indexDemands: scope.indexDemands }),
});
