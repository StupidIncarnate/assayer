/**
 * PURPOSE: Decomposes a branch's condition into its boolean TREE — connectives (`&&`, `||`, `!`) over
 *   leaf comparisons — typing each leaf's operand as it goes. It is the reason a compound condition is
 *   analyzable at all: `read-condition` classifies exactly one comparison, so `score > 5 && bonus > 1`
 *   previously read as ONE opaque operand with an `unrecognized` predicate. That was not merely
 *   incomplete, it was silently unsound — both arms derived the same arrange values, so a case claimed
 *   to reach an exit its own values cannot reach.
 *
 *   It owns no comparison semantics: every leaf still goes through `read-condition` (the raw readout)
 *   and `predicate` (the classification). All this adds is the SHAPE — which is why a new comparison
 *   still lands in `transformers/predicate` and never here.
 *
 *   `a ?? b` is a connective too, because its truthiness is a shape over other tests: `a` truthy, or
 *   `a` nullish and `b` truthy. It is spelled with `or`, `and` and `not` over a `non-nullish` leaf on
 *   `a`, so nothing downstream needs a new connective. A literal `b` is evaluated rather than read,
 *   because a literal is no input a case can set.
 *
 *   A leaf's id is the branch's coverage ID plus its positional PATH (`#leaf`, `#leaf.0`, `#leaf.1.0`),
 *   so each leaf is individually addressable for coverage. Parentheses do NOT consume a path segment:
 *   they are formatting, and `project-node` collapses them for exactly the same reason — an ID must
 *   move only when the logic moves.
 *
 *   It also emits each leaf's PROBE SITE — the offsets the instrumenter must wrap — from the same
 *   descent that assigned the leaf's id. That is deliberate and load-bearing: derive the sites in a
 *   second pass and the runtime observation could key under an id the analyzer never produced.
 *
 * USAGE:
 * readConditionTreeLayerTransformer({ condition: ifStatement.getExpression(), context, branchCoverageId, path: [] });
 * // Returns { condition: { kind: 'and', left: …, right: … }, sites: [{ id, kind: 'cond', start, end }] }
 */
import { Node, SyntaxKind } from '#gateway/npm/ts-morph';

import { conditionNodeContract, coverageContract, predicateContract } from '@assayer/shared/contracts';
import type { Coverage } from '@assayer/shared/contracts';

import { conditionTreeReadoutContract } from '../../contracts/condition-tree-readout/condition-tree-readout-contract';
import type { ConditionTreeReadout } from '../../contracts/condition-tree-readout/condition-tree-readout-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { buildConditionLeafLayerTransformer } from './build-condition-leaf-layer-transformer';
import { readConditionLayerTransformer } from './read-condition-layer-transformer';
import { readLiteralValueLayerTransformer } from './read-literal-value-layer-transformer';
import { unwrapParenthesesLayerTransformer } from './unwrap-parentheses-layer-transformer';

export const readConditionTreeLayerTransformer = ({
  condition,
  context,
  branchCoverageId,
  path,
}: {
  condition: Node;
  context: WalkContext;
  branchCoverageId: Coverage['id'];
  path: number[];
}): ConditionTreeReadout => {
  // Parens are formatting, so they must be invisible to identity: unwrap WITHOUT consuming a path
  // segment, and `(a) && b` keys identically to `a && b`. The probe site then wraps what the parens
  // wrapped, which is the same expression — so instrumentation is parens-agnostic too.
  if (Node.isParenthesizedExpression(condition)) {
    return readConditionTreeLayerTransformer({
      condition: condition.getExpression(),
      context,
      branchCoverageId,
      path,
    });
  }

  if (Node.isPrefixUnaryExpression(condition) && condition.getOperatorToken() === SyntaxKind.ExclamationToken) {
    const operand = readConditionTreeLayerTransformer({
      condition: condition.getOperand(),
      context,
      branchCoverageId,
      path: [...path, 0],
    });

    return conditionTreeReadoutContract.parse({
      condition: conditionNodeContract.parse({ kind: 'not', operand: operand.condition }),
      sites: operand.sites,
    });
  }

  if (Node.isBinaryExpression(condition)) {
    const operator = condition.getOperatorToken().getKind();

    if (operator === SyntaxKind.AmpersandAmpersandToken || operator === SyntaxKind.BarBarToken) {
      const left = readConditionTreeLayerTransformer({
        condition: condition.getLeft(),
        context,
        branchCoverageId,
        path: [...path, 0],
      });
      const right = readConditionTreeLayerTransformer({
        condition: condition.getRight(),
        context,
        branchCoverageId,
        path: [...path, 1],
      });

      return conditionTreeReadoutContract.parse({
        condition: conditionNodeContract.parse({
          kind: operator === SyntaxKind.AmpersandAmpersandToken ? 'and' : 'or',
          left: left.condition,
          right: right.condition,
        }),
        sites: [...left.sites, ...right.sites],
      });
    }

    // `a ?? b` used as a condition is truthy exactly when `a` is truthy, or when `a` is nullish and `b`
    // is truthy: `a` truthy is never nullish, and `a` falsy but not nullish is what `??` returns. So it
    // reads as `a || (a is nullish && b)`, over the connectives above. The truthiness of `a` keeps its
    // probe on `a`'s span. The nullish test on `a` has no span left to wrap, so its leaf carries no
    // probe.
    //
    // A LITERAL `b` is evaluated by its value, not read as a leaf, because no case can set a literal: a
    // falsy one (`a ?? false`, `a ?? 0`) reads as `a is non-nullish && a`, and a truthy one (`a ?? 5`) leaves `a || a is nullish`.
    if (operator === SyntaxKind.QuestionQuestionToken) {
      const truthyLeft = readConditionTreeLayerTransformer({
        condition: condition.getLeft(),
        context,
        branchCoverageId,
        path: [...path, 0],
      });
      const fallback = readLiteralValueLayerTransformer({ node: condition.getRight() });
      const nullishOperand = unwrapParenthesesLayerTransformer({ node: condition.getLeft() });
      const nullishLeaf = buildConditionLeafLayerTransformer({
        readout: {
          operandNode: nullishOperand,
          ...(Node.isIdentifier(nullishOperand) ? { operandName: nullishOperand.getText() } : {}),
          predicate: predicateContract.parse({ kind: 'non-nullish' }),
        },
        context,
        id: coverageContract.shape.id.parse(`${branchCoverageId}#leaf${[...path, 1, 0].map((index) => `.${index}`).join('')}`),
      });

      if (fallback !== undefined && !fallback) {
        return conditionTreeReadoutContract.parse({
          condition: conditionNodeContract.parse({
            kind: 'and',
            left: nullishLeaf.condition,
            right: truthyLeft.condition,
          }),
          sites: truthyLeft.sites,
        });
      }
      const isNullish = conditionNodeContract.parse({ kind: 'not', operand: nullishLeaf.condition });
      const truthyRight =
        fallback === undefined
          ? readConditionTreeLayerTransformer({
              condition: condition.getRight(),
              context,
              branchCoverageId,
              path: [...path, 1, 1],
            })
          : undefined;

      return conditionTreeReadoutContract.parse({
        condition: conditionNodeContract.parse({
          kind: 'or',
          left: truthyLeft.condition,
          right:
            truthyRight === undefined
              ? isNullish
              : conditionNodeContract.parse({ kind: 'and', left: isNullish, right: truthyRight.condition }),
        }),
        sites: [...truthyLeft.sites, ...(truthyRight === undefined ? [] : truthyRight.sites)],
      });
    }
  }

  const readout = readConditionLayerTransformer({ condition });
  const id = coverageContract.shape.id.parse(`${branchCoverageId}#leaf${path.map((index) => `.${index}`).join('')}`);

  return buildConditionLeafLayerTransformer({ readout, context, id, site: condition });
};
