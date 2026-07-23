/**
 * PURPOSE: Composes each caller's opaque call-guard with the SAME-FILE predicate it calls. A branch
 *   whose whole condition is a lone `truthy` leaf over a call (`if (tooBig(x))`) carries no arithmetic
 *   the derive-cases engine can act on, so both arms derive identical values and one silently fails.
 *   This joins that leaf back to the call site it came from (by the position both record), follows the
 *   `local` callee link to the scope it names, and — when that scope published a predicate signature —
 *   swaps the leaf for the callee's own comparison rebased onto the argument the caller passed. The
 *   existing derive-cases machinery then yields the sound pair.
 *
 *   It changes ONLY the branch condition; the branch's coverage id, kind, and line span are preserved,
 *   so the exits keyed under that branch — computed at walk time from the call-shaped id — still join.
 *   Every precondition that fails is a silent no-op: a non-truthy leaf, a leaf with no call position,
 *   an imported or method callee, a callee that published no signature, or a signature whose operand
 *   the caller did not pass straight through all leave the branch exactly as the walk read it.
 *
 * USAGE:
 * composePredicatesTransformer({ functions: extracted.functions, walked });
 * // Returns the same ExtractedFunction[], with composable call-guard branches rebased in place
 */
import { branchNodeContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import type { ExtractedFunction } from '../../contracts/extracted-function/extracted-function-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { rebasePredicateConditionTransformer } from '../rebase-predicate-condition/rebase-predicate-condition-transformer';

export const composePredicatesTransformer = ({
  functions,
  walked,
}: {
  functions: ExtractedFunction[];
  walked: WalkFileResult;
}): ExtractedFunction[] => {
  if (!walked.success) {
    return functions;
  }

  // The caller's calls, keyed by the scope that makes them; the callees, keyed by name + declaration
  // line — the same key a `local` callee link carries, so the join is a Map lookup, not a scan.
  const callsByScope = new Map(walked.scopes.map((scope) => [scope.scopePath.join('/'), scope.calls] as const));
  const calleeByKey = new Map(
    walked.scopes.map((scope) => [`${String(scope.name)}@${String(scope.startLine)}`, scope] as const),
  );

  return functions.map((fn) => ({
    entry: fn.entry,
    exits: fn.exits,
    // The entry's own return predicate is unaffected by rebasing a caller's call-guard, so it rides
    // through untouched — derive-cases reads it to split a branchless predicate's two return values.
    ...(fn.predicateSignature === undefined ? {} : { predicateSignature: fn.predicateSignature }),
    branches: fn.branches.map((branch) => {
      const leaf = branch.condition;

      if (leaf.kind !== 'leaf' || leaf.predicate.kind !== 'truthy' || leaf.operandCallPosition === undefined) {
        return branch;
      }

      const position = leaf.operandCallPosition;
      const calls = callsByScope.get(fn.entry.scopePath.join('/')) ?? [];
      const call = calls.find(
        (candidate) => candidate.position.line === position.line && candidate.position.column === position.column,
      );

      if (call === undefined || call.callee.target !== 'local') {
        return branch;
      }

      const callee = calleeByKey.get(`${String(call.callee.name)}@${String(call.callee.startLine)}`);

      if (callee?.predicateSignature === undefined) {
        return branch;
      }

      const toCallerParam = new Map<SymbolName, SymbolName>(
        callee.params.flatMap((param, index) => {
          const arg = call.args[index];
          return arg !== undefined && arg.kind === 'param-ref' ? [[param.name, arg.paramName] as const] : [];
        }),
      );

      const rebased = rebasePredicateConditionTransformer({
        node: callee.predicateSignature,
        branchCoverageId: branch.coverageId,
        path: [],
        toCallerParam,
      });

      if (rebased === undefined) {
        return branch;
      }

      return branchNodeContract.parse({
        coverageId: branch.coverageId,
        kind: branch.kind,
        condition: rebased,
        startLine: branch.startLine,
        endLine: branch.endLine,
      });
    }),
  }));
};
