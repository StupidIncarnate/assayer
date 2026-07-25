/**
 * PURPOSE: Builds the driven entry for a private callee reached through a caller that resolves its
 *   arguments — passing its own input straight in (a passthrough `param-ref`) or welding a literal
 *   value into the call. The callee's cases are derived from ITS branches and exits (P4 — the expected
 *   exit is the callee's own predicate, never a recorded output), then each arranged callee parameter
 *   is rewritten onto the caller parameter that carries it, and the arrange is laid out in the
 *   CALLER's parameter order because the interpreter applies the caller positionally.
 *
 *   A parameter the caller WELDS a literal into is pinned before derivation: its value is stamped onto
 *   the callee's condition leaves (`stamp-const-leaves`), so `derive-cases` evaluates the welded branch
 *   exactly as it evaluates a same-file welded `const` — the arm the value satisfies becomes a real
 *   case, the arm it violates an `unreachableExits` entry returned alongside the analysis for the
 *   follower to surface as an unreachable-exit lint. A welded value is baked into the caller's own body,
 *   not a settable input, so it maps onto NO caller parameter and the caller's params are filled
 *   representatively.
 *
 *   The entry keeps the callee's identity — its name, scope path, and exit ids — so coverage attaches
 *   where the logic lives; only its ACCESS becomes `through-caller`, naming the caller the runner
 *   drives. Caller parameters the callee does not consume go through the shared fill seam so the caller
 *   is fully callable, exactly as an unconstrained parameter is filled anywhere else — and a case whose
 *   caller has a param the seam REFUSES is dropped, because there is no way to call the caller at all.
 *
 *   A dropped case is not a silent one. The CALLEE's own refusals ride back on `unfillable` — untagged,
 *   because the callee IS the entry this builds and the gap is filed under its own name. Without them a
 *   private whose signature Assayer cannot construct produces nothing and the file reads as complete.
 *   The CALLER's refusals are deliberately not repeated here: the caller is an entry in its own right
 *   and its own derivation already invoices them, and one parameter owes one invoice.
 *
 * USAGE:
 * throughCallerCasesTransformer({ callee, caller, call });
 * // Returns { analysis: FunctionAnalysis (entry.access { kind: 'through-caller', callerName }),
 * //   unreachableExits: [{ line, guardLines, welded? }, …], unfillable: [{ param, type }, …] }
 */
import { derivedTestCaseContract, entryAccessContract, functionAnalysisContract } from '@assayer/shared/contracts';
import type { ArrangeBinding, FunctionAnalysis, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { CallSite } from '../../contracts/call-site/call-site-contract';
import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { callArgBindingsTransformer } from '../call-arg-bindings/call-arg-bindings-transformer';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { stampBranchesTransformer } from '../stamp-branches/stamp-branches-transformer';

export const throughCallerCasesTransformer = ({
  callee,
  caller,
  call,
}: {
  callee: ScopeRecord;
  caller: ScopeRecord;
  call: CallSite;
}): {
  analysis: FunctionAnalysis;
  unreachableExits: ReturnType<typeof deriveCasesTransformer>['unreachableExits'];
  unfillable: ReturnType<typeof deriveCasesTransformer>['unfillable'];
} => {
  // This call's arguments read into the two maps that drive the callee through the caller: each callee
  // param the caller passes one of its OWN params straight into (`toCallerParam`), and each the caller
  // WELDS a literal into (`weldByParam`, the single value that operand can take here).
  const { toCallerParam, weldByParam } = callArgBindingsTransformer({ calleeParams: callee.params, args: call.args });

  // Stamp the welded value onto the leaves that read it, so derive-cases evaluates the branch it decides
  // — the live arm a case, the dead arm an unreachable exit — instead of admitting it undriven.
  const derived = deriveCasesTransformer({
    params: callee.params,
    branches: stampBranchesTransformer({ branches: callee.branches, welds: weldByParam }),
    exits: callee.exits,
    envDrivable: false,
    // A branchless private predicate driven through its caller splits its true/false return the same
    // way a directly-analyzed one does — the callee's own comparison, never a recorded output (P4).
    ...(callee.predicateSignature === undefined ? {} : { returnPredicate: callee.predicateSignature }),
  });

  // The caller parameters a call supplies, laid out in declaration order because the interpreter applies
  // them positionally. A trailing one no caller owes and the seam cannot build is not part of the call.
  const callerParams = appliedParamsTransformer({ params: caller.params });

  const cases = derived.cases.flatMap((testCase) => {
    const byCallerParam = new Map<SymbolName, RepresentativeValue>(
      testCase.arrange.flatMap((binding) => {
        if (binding.kind !== 'param') {
          return [];
        }
        const callerParam = toCallerParam.get(binding.param);
        return callerParam === undefined ? [] : [[callerParam, binding.value] as const];
      }),
    );

    // A caller param the callee steers takes the mapped value as a scalar argument; every OTHER caller
    // param is unsteered and filled through the seam — which can REFUSE, and then there is no value to
    // call the caller with, so the case is dropped rather than built on a placeholder.
    const arrange = callerParams.flatMap((param): ArrangeBinding[] => {
      const steered = byCallerParam.get(param.name);

      if (steered !== undefined) {
        return [{ kind: 'param', param: param.name, value: steered }];
      }

      const fill = fillParamTransformer({ param });

      return fill.kind === 'filled' ? [fill.binding] : [];
    });

    return arrange.length === callerParams.length
      ? [derivedTestCaseContract.parse({ reachesPath: testCase.reachesPath, arrange })]
      : [];
  });

  return {
    analysis: functionAnalysisContract.parse({
      entry: {
        name: callee.name,
        scopePath: callee.scopePath,
        params: callee.params,
        returnType: callee.returnType,
        line: callee.startLine,
        access: entryAccessContract.parse({ kind: 'through-caller', callerName: caller.name }),
      },
      branches: callee.branches,
      exits: callee.exits,
      cases,
      // The callee's own return comparison, carried onto the entry it becomes: this IS the callee, so a
      // reader re-deriving from the analysis sees the axis its cases were derived with.
      ...(callee.predicateSignature === undefined ? {} : { predicateSignature: callee.predicateSignature }),
    }),
    unreachableExits: derived.unreachableExits,
    // The callee's own parameters, and this entry IS the callee — so the gap files under its name with
    // no owner to name, exactly as a directly-derived scope's refusals do.
    unfillable: derived.unfillable,
  };
};
