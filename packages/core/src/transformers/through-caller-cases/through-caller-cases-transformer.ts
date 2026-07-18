/**
 * PURPOSE: Builds the driven entry for a private callee reached through a caller that passes its own
 *   input straight in. The callee's cases are derived from ITS branches and exits (P4 — the expected
 *   exit is the callee's own predicate, never a recorded output), then each arranged callee parameter
 *   is rewritten onto the caller parameter that carries it, and the arrange is laid out in the
 *   CALLER's parameter order because the interpreter applies the caller positionally.
 *
 *   The entry keeps the callee's identity — its name, scope path, and exit ids — so coverage attaches
 *   where the logic lives; only its ACCESS becomes `through-caller`, naming the caller the runner
 *   drives. Caller parameters the callee does not consume are filled with representative values so the
 *   caller is fully callable, exactly as an unconstrained parameter is filled anywhere else.
 *
 * USAGE:
 * throughCallerCasesTransformer({ callee, caller, call });
 * // Returns a FunctionAnalysis whose entry.access is { kind: 'through-caller', callerName }
 */
import { derivedTestCaseContract, entryAccessContract, functionAnalysisContract } from '@assayer/shared/contracts';
import type { FunctionAnalysis, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { CallSite } from '../../contracts/call-site/call-site-contract';
import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const throughCallerCasesTransformer = ({
  callee,
  caller,
  call,
}: {
  callee: ScopeRecord;
  caller: ScopeRecord;
  call: CallSite;
}): FunctionAnalysis => {
  // Each callee parameter maps to the caller parameter passed straight into it at this call site.
  const toCallerParam = new Map<SymbolName, SymbolName>(
    callee.params.flatMap((param, index) => {
      const arg = call.args[index];
      return arg !== undefined && arg.kind === 'param-ref' ? [[param.name, arg.paramName] as const] : [];
    }),
  );

  const cases = deriveCasesTransformer({
    params: callee.params,
    branches: callee.branches,
    exits: callee.exits,
    envDrivable: false,
  }).map((testCase) => {
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
      reachesExit: testCase.reachesExit,
      arrange: caller.params.map((param) => ({
        kind: 'param',
        param: param.name,
        value: byCallerParam.get(param.name) ?? representativeValueTransformer({ type: param.type }),
      })),
    });
  });

  return functionAnalysisContract.parse({
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
  });
};
