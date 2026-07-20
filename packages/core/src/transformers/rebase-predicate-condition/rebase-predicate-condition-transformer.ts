/**
 * PURPOSE: Rebases a callee's predicate condition onto a CALLER's argument names, re-minting every
 *   leaf id under the caller's branch. It is what lets a caller's opaque `if (tooBig(x))` leaf be
 *   replaced by `tooBig`'s own `n > 50` comparison, expressed against the `x` the caller passed —
 *   turning a guard the single-file walk could not read into one the derive-cases engine can.
 *
 *   Every leaf's operand must be a callee PARAMETER the caller passed one of its own params straight
 *   into (`toCallerParam`); a leaf whose operand is anything else (a welded literal, a closed-over
 *   binding, an unmapped param) cannot be steered from the caller, so the whole condition refuses by
 *   returning undefined — a partial rebase would key a coverage id to an operand no caller input
 *   reaches. `operandEnvVarName`/`operandCallPosition` are DROPPED: they described the callee's own
 *   source, and the rebased leaf lives in the caller's.
 *
 * USAGE:
 * rebasePredicateConditionTransformer({ node: calleeSignature, branchCoverageId, path: [], toCallerParam });
 * // Returns the rebased ConditionNode, or undefined when a leaf cannot be mapped onto a caller param
 */
import { conditionNodeContract } from '@assayer/shared/contracts';
import type { ConditionNode, CoverageId, SymbolName } from '@assayer/shared/contracts';

export const rebasePredicateConditionTransformer = ({
  node,
  branchCoverageId,
  path,
  toCallerParam,
}: {
  node: ConditionNode;
  branchCoverageId: CoverageId;
  path: number[];
  toCallerParam: Map<SymbolName, SymbolName>;
}): ConditionNode | undefined => {
  if (node.kind === 'leaf') {
    const callerParam = node.operandParamName === undefined ? undefined : toCallerParam.get(node.operandParamName);

    if (callerParam === undefined) {
      return undefined;
    }

    return conditionNodeContract.parse({
      kind: 'leaf',
      id: `${branchCoverageId}#leaf${path.map((index) => `.${index}`).join('')}`,
      operandParamName: callerParam,
      operandType: node.operandType,
      predicate: node.predicate,
    });
  }

  if (node.kind === 'not') {
    const operand = rebasePredicateConditionTransformer({
      node: node.operand,
      branchCoverageId,
      path: [...path, 0],
      toCallerParam,
    });

    return operand === undefined ? undefined : conditionNodeContract.parse({ kind: 'not', operand });
  }

  const left = rebasePredicateConditionTransformer({
    node: node.left,
    branchCoverageId,
    path: [...path, 0],
    toCallerParam,
  });
  const right = rebasePredicateConditionTransformer({
    node: node.right,
    branchCoverageId,
    path: [...path, 1],
    toCallerParam,
  });

  return left === undefined || right === undefined
    ? undefined
    : conditionNodeContract.parse({ kind: node.kind, left, right });
};
