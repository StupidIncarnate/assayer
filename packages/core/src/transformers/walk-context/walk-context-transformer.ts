/**
 * PURPOSE: Derives the context a walk hands DOWN to a node's children. This is the single owner of
 *   the rules that make constructs compose: entering a SCOPE extends `scopePath` and RESETS
 *   `guardPath` (a nested function's branches are not guarded by the `if` its declaration sits in,
 *   and it brings its own params); entering a branch ARM appends a guard step and leaves the scope
 *   alone (an arm is not a scope — it owes its coverage IDs to the function around it). Because a
 *   handler describes its children's context through here rather than recursing itself, a construct
 *   never has to know which constructs enclose it.
 *
 * USAGE:
 * walkContextTransformer({ context, guardStep: { branchCoverageId: 'classify/if:…', arm: 'then' } });
 * walkContextTransformer({ context, scopeSegment: 'inner', params: [], exported: false });
 * // Returns a new validated WalkContext — never mutates the one passed in
 */
import { walkContextContract } from '../../contracts/walk-context/walk-context-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import type { GuardStep, ParamDescriptor, SymbolName } from '@assayer/shared/contracts';

export const walkContextTransformer = ({
  context,
  scopeSegment,
  guardSteps,
  params,
  exported,
  tail,
  enclosingClass,
}: {
  context: WalkContext;
  scopeSegment?: SymbolName;
  guardSteps?: GuardStep[];
  params?: ParamDescriptor[];
  exported?: boolean;
  tail?: boolean;
  enclosingClass?: { name: SymbolName; constructable: boolean };
}): WalkContext => {
  // Same reset rule as guardPath, for the same reason: a class hands its identity to its MEMBERS,
  // but entering any other scope clears it — a function nested inside a method is not a method.
  const nextClass = scopeSegment === undefined ? context.enclosingClass : enclosingClass;

  return walkContextContract.parse({
    scopePath: scopeSegment === undefined ? context.scopePath : [...context.scopePath, scopeSegment],
    // Entering a scope resets the guard path; entering an arm appends to it. Never both at once.
    guardPath:
      scopeSegment === undefined
        ? guardSteps === undefined
          ? context.guardPath
          : [...context.guardPath, ...guardSteps]
        : [],
    params: params === undefined ? context.params : params,
    exported: exported === undefined ? context.exported : exported,
    // A scope body is in tail position by definition: reaching its end ends the scope.
    tail: scopeSegment === undefined ? (tail === undefined ? context.tail : tail) : true,
    // Omitted rather than set undefined: a context with no class must be strictly equal to one that
    // never had the key, or every golden assertion downstream churns.
    ...(nextClass === undefined ? {} : { enclosingClass: nextClass }),
  });
};
