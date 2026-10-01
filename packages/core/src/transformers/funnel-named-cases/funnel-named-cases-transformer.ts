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
 *   `unfillable` rides up the same way, tagged at each hop with the scope that DECLARES the refused
 *   parameter. A funnelled private is no entry of its own, so a parameter its signature declares and the
 *   fill seam refuses would otherwise stop the surface deriving anything with nothing said — the exact
 *   reads-as-complete silence the gap channel exists to break. The surface's own refusals are tagged with
 *   the surface, and the gap channel de-duplicates them against its own derivation's.
 *
 *   `harness` is that refusal being CLOSED, keyed by the scope it was raised against rather than a single
 *   spec: a funnelled private is reached only through its host, but the harness that pays its refusal
 *   names the PRIVATE (`on \`build\``), never the host, so the map is consulted at EVERY hop by that
 *   hop's own `scope.name` — the surface's own params at the top, then each private's own params as the
 *   recursion descends into it. A hop with no entry in the map derives exactly as it does with none at
 *   all. The binding this seeds rides up through the SAME generic rebase every other binding kind
 *   already does (`{ ...binding, param: param.name }`), so it is BOUND where the private is called —
 *   the caller's own param slot — never spliced onto the host's argument list as an extra positional
 *   argument the signature has no slot for.
 *
 *   `consumed` carries each private's own full parameter list alongside its name, so a caller building
 *   the file's `declaringScopes` fact (what `harness-validate` and this same overlay both read) does not
 *   have to re-walk the scope records this transformer already holds.
 *
 * USAGE:
 * funnelNamedCasesTransformer({ scope: outer, scopes, welds: new Map() });
 * // Returns { cases, unreachable: [{ line, guardLines, welded?, displayName }],
 * //   consumed: [{ name, startLine, params }], unfillable: [{ param, type, owner }] }
 */
import { derivedTestCaseContract, entryLabelContract } from '@assayer/shared/contracts';
import type { ArrangeBinding, ConstLength, DerivedTestCase, EntryLabel, LineNumber, ParamDescriptor, RepresentativeValue, TypeText } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { callArgBindingsTransformer } from '../call-arg-bindings/call-arg-bindings-transformer';
import { deriveCasesRequestTransformer } from '../derive-cases-request/derive-cases-request-transformer';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { findReturnedPrivateTransformer } from '../find-returned-private/find-returned-private-transformer';

export const funnelNamedCasesTransformer = ({
  scope,
  scopes,
  welds,
  harness,
}: {
  scope: ScopeRecord;
  scopes: ScopeRecord[];
  welds: Map<string, RepresentativeValue>;
  harness?: ReadonlyMap<string, readonly string[]>;
}): {
  cases: DerivedTestCase[];
  unreachable: {
    line: LineNumber;
    guardLines: LineNumber[];
    welded?: { line: LineNumber; operand?: string; value?: RepresentativeValue; length?: ConstLength };
    displayName: string;
  }[];
  consumed: { name: string; startLine: LineNumber; params: ParamDescriptor[] }[];
  unfillable: { param: string; type: TypeText; owner: EntryLabel }[];
} => {
  // A harness spec for THIS hop alone — the map is consulted by this scope's own name, never a
  // caller's, so a private's harness never leaks onto the surface's own derivation or a sibling private.
  const ownHarness = harness?.get(scope.name);

  // This scope's own cases, over its own branches with any inherited weld stamped — the same derivation
  // a directly-analyzed scope gets, so a welded arm evaluates rather than being admitted, and a
  // harness-supplied parameter binds rather than being refused.
  const derived = deriveCasesTransformer(
    deriveCasesRequestTransformer({
      scope,
      params: scope.params,
      welds,
      envDrivable: false,
      harness: ownHarness === undefined ? undefined : { entry: scope.name, params: ownHarness },
    }),
  );

  // The scope parameters a call supplies, in declaration order because the interpreter applies them
  // positionally — a trailing one no caller owes and the seam cannot build is not part of the call.
  const scopeParams = appliedParamsTransformer({ params: scope.params });

  const perBase = derived.cases.map((baseCase) => {
    const [exitId] = baseCase.reachesPath;
    const exit = scope.exits.find((candidate) => String(candidate.coverageId) === String(exitId));
    const found = exit === undefined ? undefined : findReturnedPrivateTransformer({ scope, exit, scopes });

    // A leaf exit — a literal return or a call the funnel does not follow — keeps its own case.
    if (exit === undefined || found === undefined) {
      return {
        cases: [derivedTestCaseContract.parse({ reachesPath: baseCase.reachesPath, arrange: baseCase.arrange, salient: true })],
        unreachable: [],
        consumed: [] as { name: string; startLine: LineNumber; params: ParamDescriptor[] }[],
        unfillable: [] as { param: string; type: TypeText; owner: EntryLabel }[],
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
    const calleeToScope = new Map<string, string>();
    bindings.toCallerParam.forEach((callerParam, calleeParam) => {
      if (!welds.has(callerParam)) {
        calleeToScope.set(calleeParam, callerParam);
      }
    });

    const sub = funnelNamedCasesTransformer({
      scope: privateScope,
      scopes,
      welds: privateWelds,
      ...(harness === undefined ? {} : { harness }),
    });

    const cases = sub.cases.flatMap((subCase) => {
      // A steered surface param takes the private's arranged value under its own name; every other
      // surface param keeps the value THIS scope's OWN derivation already arranged for it (`baseCase`) —
      // a private scope funnelled here can carry its OWN branch (that is exactly what makes it eligible:
      // `find-returned-private` requires one), and that branch may read a param the deeper hop never
      // touches. A blind representative re-fill would arrange a value that does not satisfy the very
      // guard this case's `exit` depends on — reachesPath would claim an exit the arrange cannot reach.
      // Only a param BASE-CASE itself has no entry for falls to the shared fill seam, and a param the
      // seam REFUSES there drops the case, since the surface cannot be called at all.
      const arrange = scopeParams.flatMap((param): ArrangeBinding[] => {
        const [calleeParam] =
          [...calleeToScope.entries()].find(([, callerParam]) => String(callerParam) === String(param.name)) ?? [];
        const binding =
          calleeParam === undefined
            ? undefined
            : subCase.arrange.find((entry) => entry.kind !== 'env' && String(entry.param) === String(calleeParam));

        if (binding !== undefined && binding.kind !== 'env') {
          return [{ ...binding, param: param.name }];
        }

        const own = baseCase.arrange.find((entry) => entry.kind !== 'env' && String(entry.param) === String(param.name));

        if (own !== undefined) {
          return [own];
        }

        const fill = fillParamTransformer({ param });

        return fill.kind === 'filled' ? [fill.binding] : [];
      });

      return arrange.length === scopeParams.length
        ? [
            derivedTestCaseContract.parse({
              // The private's path reaches its own exit(s) first, then this scope returns through the
              // exit that called it.
              reachesPath: [...subCase.reachesPath, exit.coverageId],
              arrange,
              salient: true,
            }),
          ]
        : [];
    });

    return {
      cases,
      unreachable: sub.unreachable,
      consumed: [{ name: privateScope.name, startLine: privateScope.startLine, params: privateScope.params }, ...sub.consumed],
      unfillable: sub.unfillable,
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
    // Same shape as `unreachable`: this scope's own refusals tagged with ITS name, the deeper ones
    // already tagged with theirs. The top hop is the surface, whose own derivation invoices the same
    // refusals — the gap channel de-duplicates on (scope, parameter), so it is stated once.
    unfillable: [
      ...derived.unfillable.map((refusal) => ({ ...refusal, owner: entryLabelContract.parse(String(scope.name)) })),
      ...perBase.flatMap((entry) => entry.unfillable),
    ],
  };
};
