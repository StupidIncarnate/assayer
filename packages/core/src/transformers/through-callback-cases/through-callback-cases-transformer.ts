/**
 * PURPOSE: Drives an inline callback's branches THROUGH the entry that maps it over an array param —
 *   the array/element twin of `through-caller-cases`. A callback passed to `items.map((n) => …)` binds
 *   its FIRST parameter to the array element, so steering that element steers the callback: derive the
 *   callback's OWN cases over its element param (P4 — the asserted exit is the callback's own predicate,
 *   never a recorded output), then lay each steered element value into the entry's array param as a
 *   single-element array. Every other entry parameter is filled representative so the entry stays
 *   callable, exactly as an unconstrained parameter is filled anywhere else.
 *
 *   The entry keeps the callback's identity — its name, scope path, and exit ids — so coverage attaches
 *   where the logic lives; only its ACCESS becomes `through-caller`, naming the entry the runner drives.
 *   The callback is never invoked directly; the runner calls the entry with the steered array and the
 *   entry's own `.map` reaches the callback, exactly as a private is reached through its caller.
 *
 * USAGE:
 * throughCallbackCasesTransformer({ callback, entry, arrayParam: 'items' });
 * // Returns a FunctionAnalysis whose entry.access is { kind: 'through-caller', callerName }
 */
import { derivedTestCaseContract, entryAccessContract, functionAnalysisContract } from '@assayer/shared/contracts';
import type { ArrangeValue, FunctionAnalysis, SymbolName } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const throughCallbackCasesTransformer = ({
  callback,
  entry,
  arrayParam,
}: {
  callback: ScopeRecord;
  entry: ScopeRecord;
  arrayParam: SymbolName;
}): FunctionAnalysis => {
  // The callback's first parameter is the one bound to the array element; its steered value is the
  // array's single element. The callback's branches are derived over it exactly as a scalar param.
  const elementParamName = callback.params[0]?.name;

  const cases = deriveCasesTransformer({
    params: callback.params,
    branches: callback.branches,
    exits: callback.exits,
    envDrivable: false,
  }).cases.map((testCase) => {
    const elementBinding = testCase.arrange.find(
      (binding) =>
        binding.kind === 'param' && elementParamName !== undefined && String(binding.param) === String(elementParamName),
    );
    // A one-element array carrying the steered element. An empty array runs the callback zero times, so
    // the element that steers the branch must actually be present.
    const element: ArrangeValue[] = elementBinding !== undefined && elementBinding.kind === 'param' ? [elementBinding.value] : [];

    return derivedTestCaseContract.parse({
      reachesExit: testCase.reachesExit,
      salient: testCase.salient,
      arrange: entry.params.map((param) =>
        String(param.name) === String(arrayParam)
          ? { kind: 'array', param: param.name, value: element }
          : { kind: 'param', param: param.name, value: representativeValueTransformer({ type: param.type }) },
      ),
    });
  });

  return functionAnalysisContract.parse({
    entry: {
      name: callback.name,
      scopePath: callback.scopePath,
      params: callback.params,
      returnType: callback.returnType,
      line: callback.startLine,
      access: entryAccessContract.parse({ kind: 'through-caller', callerName: entry.name }),
    },
    branches: callback.branches,
    exits: callback.exits,
    cases,
  });
};
