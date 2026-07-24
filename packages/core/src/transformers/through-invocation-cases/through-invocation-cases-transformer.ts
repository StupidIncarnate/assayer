/**
 * PURPOSE: Builds the driven entry for an inline function INVOKED IN PLACE — an IIFE, `((n) => …)(x)`.
 *   It is the MODULE-LOAD twin of `through-caller-cases`: an IIFE runs when the module is imported, so
 *   the arrow is an extension of the module scope, driven the same way a top-level branch is — by the
 *   ENVIRONMENT it reads on the way, or by a value the invocation WELDS into a parameter.
 *
 *   Two things drive it, and both flow through one `derive-cases` call with `envDrivable: true`:
 *   - an env-BODY read (`const n = Number(process.env.T)`) makes the environment an input, so each arm
 *     is a case that sets the variable and imports the module fresh;
 *   - a WELDED invocation argument (`(…)(7)`) pins a parameter's single value — stamped onto the arrow's
 *     leaves (`stamp-const-leaves`) so the arm it satisfies is a case and the arm it violates an
 *     `unreachableExits` entry, exactly as a same-file welded `const` evaluates.
 *
 *   Cases are derived over an EMPTY parameter list, because the runner drives a module by importing it
 *   and cannot pass arguments: an env leaf arranges the variable, a welded leaf arranges nothing, and no
 *   other operand can be steered. The entry keeps the arrow's identity — its scope path and exit ids, so
 *   coverage attaches where the logic lives — but its ACCESS is `module` (the surface renders it by the
 *   file's label, never the arrow's structural name) and its params are the empty module-load list.
 *
 * USAGE:
 * throughInvocationCasesTransformer({ arrow, args: [{ kind: 'literal', value: 7 }] });
 * // Returns { analysis: FunctionAnalysis (entry.access { kind: 'module' }), unreachableExits: [...] }
 */
import { entryAccessContract, functionAnalysisContract } from '@assayer/shared/contracts';
import type { FunctionAnalysis } from '@assayer/shared/contracts';

import type { CallArg } from '../../contracts/call-site/call-site-contract';
import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import { callArgBindingsTransformer } from '../call-arg-bindings/call-arg-bindings-transformer';
import { deriveCasesTransformer } from '../derive-cases/derive-cases-transformer';
import { stampBranchesTransformer } from '../stamp-branches/stamp-branches-transformer';

export const throughInvocationCasesTransformer = ({
  arrow,
  args,
}: {
  arrow: ScopeRecord;
  args: CallArg[];
}): { analysis: FunctionAnalysis; unreachableExits: ReturnType<typeof deriveCasesTransformer>['unreachableExits'] } => {
  // Each arrow parameter the invocation WELDS a literal into — the single value that operand takes at
  // module load. The invocation passes no caller params through, so only the weld half is used; a
  // non-literal argument (an env-sourced call, an opaque expression) welds nothing.
  const { weldByParam } = callArgBindingsTransformer({ calleeParams: arrow.params, args });

  const derived = deriveCasesTransformer({
    // The runner drives a module by importing it, so its parameters are not settable: derive over an
    // empty list, and an env or welded leaf arranges itself without a param binding.
    params: [],
    branches: stampBranchesTransformer({ branches: arrow.branches, welds: weldByParam }),
    exits: arrow.exits,
    // The arrow runs at import time, so the environment it reads is an input — exactly why a module
    // scope is env-drivable and a function is not.
    envDrivable: true,
    ...(arrow.predicateSignature === undefined ? {} : { returnPredicate: arrow.predicateSignature }),
  });

  return {
    analysis: functionAnalysisContract.parse({
      entry: {
        name: arrow.name,
        scopePath: arrow.scopePath,
        params: [],
        returnType: arrow.returnType,
        line: arrow.startLine,
        access: entryAccessContract.parse({ kind: 'module' }),
      },
      branches: arrow.branches,
      exits: arrow.exits,
      cases: derived.cases,
    }),
    unreachableExits: derived.unreachableExits,
  };
};
