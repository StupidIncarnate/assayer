/**
 * PURPOSE: Stamps a WELDED scalar value onto every condition leaf whose operand is a given param —
 *   returning a NEW condition tree, the original untouched. It is what lets a callee reached through a
 *   caller that welds a literal argument (`report(){ return decide(3) }`) be EVALUATED: the caller's
 *   fixed `3` is the single value `decide`'s `value` operand can take, so a leaf reading `value` is
 *   marked `operandConstValue: 3` and `derive-cases` treats it as a single-value domain — the arm that
 *   value satisfies becomes a real case, the arm it violates an unreachable exit. It is the through-caller
 *   twin of the walk's own `read-const-operand`, which stamps a same-file `const` at parse time; here the
 *   constant lives in the CALLER's argument, learned only when the call is followed.
 *
 *   Only a SCALAR leaf is stamped — one whose operand is the welded param itself, never an object-member
 *   read of it (`config.mode`), which a literal argument cannot pin. The value is an INPUT taken from the
 *   call's literal argument (P4-safe), never a recorded output.
 *
 * USAGE:
 * stampConstLeavesTransformer({ condition: decideIfTree, welds: new Map([['value', 3]]) });
 * // Returns a ConditionNode identical to the input but with `value` leaves carrying operandConstValue: 3
 */
import type { ConditionNode, RepresentativeValue } from '@assayer/shared/contracts';

export const stampConstLeavesTransformer = ({
  condition,
  welds,
}: {
  condition: ConditionNode;
  welds: Map<string, RepresentativeValue>;
}): ConditionNode => {
  if (condition.kind === 'leaf') {
    const weld = condition.operandParamName === undefined ? undefined : welds.get(condition.operandParamName);

    // A scalar operand only: an object-member read (`config.mode`) names the same root param but is not
    // pinned by a welded literal, so it keeps its property fact and stays for the stub stitch to drive.
    return weld === undefined || condition.operandPropertyPath !== undefined
      ? condition
      : { ...condition, operandConstValue: weld };
  }

  if (condition.kind === 'not') {
    return { kind: 'not', operand: stampConstLeavesTransformer({ condition: condition.operand, welds }) };
  }

  return {
    kind: condition.kind,
    left: stampConstLeavesTransformer({ condition: condition.left, welds }),
    right: stampConstLeavesTransformer({ condition: condition.right, welds }),
  };
};
