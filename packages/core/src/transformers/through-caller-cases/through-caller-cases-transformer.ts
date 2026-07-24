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
 *   drives. Caller parameters the callee does not consume are filled with representative values so the
 *   caller is fully callable, exactly as an unconstrained parameter is filled anywhere else.
 *
 * USAGE:
 * throughCallerCasesTransformer({ callee, caller, call });
 * // Returns { analysis: FunctionAnalysis (entry.access { kind: 'through-caller', callerName }),
 * //   unreachableExits: [{ line, guardLines, welded? }, …] }
 */
import { derivedTestCaseContract, entryAccessContract, functionAnalysisContract } from '@assayer/shared/contracts';
import type { FunctionAnalysis, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { CallSite } from '../../contracts/call-site/call-site-contract';
import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
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
}): { analysis: FunctionAnalysis; unreachableExits: ReturnType<typeof deriveCasesTransformer>['unreachableExits'] } => {
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

  const cases = derived.cases.map((testCase) => {
    const byCallerParam = new Map<SymbolName, RepresentativeValue>(
      testCase.arrange.flatMap((binding) => {
        if (binding.kind !== 'param') {
          return [];
        }
        const callerParam = toCallerParam.get(binding.param);
        return callerParam === undefined ? [] : [[callerParam, binding.value] as const];
      }),
    );

    return derivedTestCaseContract.parse({
      reachesPath: testCase.reachesPath,
      // A caller param the callee steers takes the mapped value as a scalar argument; every OTHER caller
      // param is unsteered and filled — a sibling ARRAY param takes a real array, not a scalar that throws.
      arrange: caller.params.map((param) => {
        const steered = byCallerParam.get(param.name);
        return steered === undefined ? fillParamTransformer({ param }) : { kind: 'param', param: param.name, value: steered };
      }),
    });
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
    }),
    unreachableExits: derived.unreachableExits,
  };
};
