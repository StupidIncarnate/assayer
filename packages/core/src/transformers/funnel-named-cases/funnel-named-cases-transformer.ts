/**
 * PURPOSE: Folds a same-file PRIVATE a reachable surface CALLS and RETURNS into the surface's own case
 *   set, so the surface is the ONLY entry — the named-call twin of the callback funnel. A private
 *   reached only through `return helper(x)` cannot be driven without calling the surface, so its
 *   steering values FUNNEL into the surface's cases: each case predicts the ordered PATH the flow
 *   reaches — the private's own exit, then the surface's return — and arranges the surface's params.
 *
 *   It recurses for the TRANSITIVE case (a function in a function in a function): when the private is
 *   itself a surface that returns a deeper private, that hop folds in first, so its exit sits innermost
 *   in the path. Each hop reuses the same primitives `through-caller-cases` does — `derive-cases` over
 *   the private's branches (with a welded argument stamped by `stamp-const-leaves`), the callee→caller
 *   parameter map from `call-arg-bindings`, and `fill-param` for every surface param the private does
 *   not steer — so a welded argument is EVALUATED here too: the live arm is a case, the dead arm an
 *   `unreachable` entry carried up for the surface's lint (tagged with the private's own name, since the
 *   dead code lives there while the surface is the entry that owns it).
 *
 *   Returns cases in THIS scope's own params; the caller rebases them onto its params as it folds this
 *   scope in. `consumed` names every private the funnel drove, so the follower drops them from its
 *   per-scope classification instead of double-reporting them as through-caller entries.
 *
 * USAGE:
 * funnelNamedCasesTransformer({ scope: outer, scopes, welds: new Map() });
 * // Returns { cases, unreachable: [{ line, guardLines, welded?, displayName }], consumed: [{ name, startLine }] }
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { ConstLength, DerivedTestCase, LineNumber, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { callArgBindingsTransformer } from '../call-arg-bindings/call-arg-bindings-transformer';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { findReturnedPrivateTransformer } from '../find-returned-private/find-returned-private-transformer';
import { stampBranchesTransformer } from '../stamp-branches/stamp-branches-transformer';

export const funnelNamedCasesTransformer = ({
  scope,
  scopes,
  welds,
}: {
  scope: ScopeRecord;
  scopes: ScopeRecord[];
  welds: Map<SymbolName, RepresentativeValue>;
}): {
  cases: DerivedTestCase[];
  unreachable: {
    line: LineNumber;
    guardLines: LineNumber[];
    welded?: { line: LineNumber; operand?: SymbolName; value?: RepresentativeValue; length?: ConstLength };
    displayName: SymbolName;
  }[];
  consumed: { name: SymbolName; startLine: LineNumber }[];
} => {
  // This scope's own cases, over its own branches with any inherited weld stamped — the same derivation
  // a directly-analyzed scope gets, so a welded arm evaluates rather than being admitted.
  const derived = deriveCasesTransformer({
    params: scope.params,
    branches: stampBranchesTransformer({ branches: scope.branches, welds }),
    exits: scope.exits,
    envDrivable: false,
    ...(scope.predicateSignature === undefined ? {} : { returnPredicate: scope.predicateSignature }),
  });

  const perBase = derived.cases.map((baseCase) => {
    const [exitId] = baseCase.reachesPath;
    const exit = scope.exits.find((candidate) => String(candidate.coverageId) === String(exitId));
    const found = exit === undefined ? undefined : findReturnedPrivateTransformer({ scope, exit, scopes });

    // A leaf exit — a literal return or a call the funnel does not follow — keeps its own case.
    if (exit === undefined || found === undefined) {
      return {
        cases: [derivedTestCaseContract.parse({ reachesPath: baseCase.reachesPath, arrange: baseCase.arrange, salient: true })],
        unreachable: [],
        consumed: [] as { name: SymbolName; startLine: LineNumber }[],
      };
    }

    const { privateScope, call } = found;
    const bindings = callArgBindingsTransformer({ calleeParams: privateScope.params, args: call.args });

    // The private's welds: a literal argument the surface welds in, plus any surface param passed
    // through that is ITSELF welded — a fixed value propagates one hop deeper.
    const privateWelds = new Map(bindings.weldByParam);
    bindings.toCallerParam.forEach((callerParam, calleeParam) => {
      const inheritedWeld = welds.get(callerParam);
      if (inheritedWeld !== undefined) {
        privateWelds.set(calleeParam, inheritedWeld);
      }
    });

    // The private params the surface STEERS: passed straight through from a surface param that is not
    // itself welded. Each maps back onto that surface param when the private's cases rebase up.
    const calleeToScope = new Map<SymbolName, SymbolName>();
    bindings.toCallerParam.forEach((callerParam, calleeParam) => {
      if (!welds.has(callerParam)) {
        calleeToScope.set(calleeParam, callerParam);
      }
    });

    const sub = funnelNamedCasesTransformer({ scope: privateScope, scopes, welds: privateWelds });

    const cases = sub.cases.map((subCase) =>
      derivedTestCaseContract.parse({
        // The private's path reaches its own exit(s) first, then this scope returns through the exit
        // that called it.
        reachesPath: [...subCase.reachesPath, exit.coverageId],
        arrange: scope.params.map((param) => {
          const [calleeParam] =
            [...calleeToScope.entries()].find(([, callerParam]) => String(callerParam) === String(param.name)) ?? [];
          const binding =
            calleeParam === undefined
              ? undefined
              : subCase.arrange.find((entry) => entry.kind !== 'env' && String(entry.param) === String(calleeParam));
          // A steered surface param takes the private's arranged value under its own name; every other
          // surface param is unsteered and filled representative so the surface stays callable.
          return binding === undefined ? fillParamTransformer({ param }) : { ...binding, param: param.name };
        }),
        salient: true,
      }),
    );

    return {
      cases,
      unreachable: sub.unreachable,
      consumed: [{ name: privateScope.name, startLine: privateScope.startLine }, ...sub.consumed],
    };
  });

  return {
    cases: perBase.flatMap((entry) => entry.cases),
    // This scope's own welded-dead arms carry ITS display name; the deeper ones already carry theirs.
    unreachable: [
      ...derived.unreachableExits.map((exit) => ({ ...exit, displayName: scope.name })),
      ...perBase.flatMap((entry) => entry.unreachable),
    ],
    consumed: perBase.flatMap((entry) => entry.consumed),
  };
};
