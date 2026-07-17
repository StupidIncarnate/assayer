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
 * readConditionTreeLayerAdapter({ condition: ifStatement.getExpression(), context, branchCoverageId, path: [] });
 * // Returns { condition: { kind: 'and', left: …, right: … }, sites: [{ id, kind: 'cond', start, end }] }
 */
import { Node, SyntaxKind } from 'ts-morph';

import { conditionNodeContract, coverageIdContract } from '@assayer/shared/contracts';
import type { ConditionNode, CoverageId } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { readConditionLayerAdapter } from './read-condition-layer-adapter';
import { readEnvOperandLayerAdapter } from './read-env-operand-layer-adapter';
import { readOperandTypeLayerAdapter } from './read-operand-type-layer-adapter';

export interface ConditionTreeReadout {
  condition: ConditionNode;
  sites: ProbeSite[];
}

export const readConditionTreeLayerAdapter = ({
  condition,
  context,
  branchCoverageId,
  path,
}: {
  condition: Node;
  context: WalkContext;
  branchCoverageId: CoverageId;
  path: number[];
}): ConditionTreeReadout => {
  // Parens are formatting, so they must be invisible to identity: unwrap WITHOUT consuming a path
  // segment, and `(a) && b` keys identically to `a && b`. The probe site then wraps what the parens
  // wrapped, which is the same expression — so instrumentation is parens-agnostic too.
  if (Node.isParenthesizedExpression(condition)) {
    return readConditionTreeLayerAdapter({
      condition: condition.getExpression(),
      context,
      branchCoverageId,
      path,
    });
  }

  if (Node.isPrefixUnaryExpression(condition) && condition.getOperatorToken() === SyntaxKind.ExclamationToken) {
    const operand = readConditionTreeLayerAdapter({
      condition: condition.getOperand(),
      context,
      branchCoverageId,
      path: [...path, 0],
    });

    return {
      condition: conditionNodeContract.parse({ kind: 'not', operand: operand.condition }),
      sites: operand.sites,
    };
  }

  if (Node.isBinaryExpression(condition)) {
    const operator = condition.getOperatorToken().getKind();

    if (operator === SyntaxKind.AmpersandAmpersandToken || operator === SyntaxKind.BarBarToken) {
      const left = readConditionTreeLayerAdapter({
        condition: condition.getLeft(),
        context,
        branchCoverageId,
        path: [...path, 0],
      });
      const right = readConditionTreeLayerAdapter({
        condition: condition.getRight(),
        context,
        branchCoverageId,
        path: [...path, 1],
      });

      return {
        condition: conditionNodeContract.parse({
          kind: operator === SyntaxKind.AmpersandAmpersandToken ? 'and' : 'or',
          left: left.condition,
          right: right.condition,
        }),
        sites: [...left.sites, ...right.sites],
      };
    }
  }

  const readout = readConditionLayerAdapter({ condition });
  const id = coverageIdContract.parse(`${branchCoverageId}#leaf${path.map((index) => `.${index}`).join('')}`);
  // WHERE the operand's value came from — a different question from what its type is, asked of a
  // different reader. Recorded wherever it is true; whether an entry can be driven through it is
  // policy, and policy lives in the projections.
  const envVarName = readEnvOperandLayerAdapter({ node: readout.operandNode });

  return {
    condition: conditionNodeContract.parse({
      kind: 'leaf',
      id,
      ...(readout.operandName === undefined ? {} : { operandParamName: readout.operandName }),
      ...(envVarName === undefined ? {} : { operandEnvVarName: envVarName }),
      operandType: readOperandTypeLayerAdapter({
        node: readout.operandNode,
        context,
        ...(readout.operandName === undefined ? {} : { name: readout.operandName }),
      }),
      predicate: readout.predicate,
    }),
    // The site wraps the LEAF EXPRESSION as written — `condition`, not the operand `read-condition`
    // picked out. Wrapping in place is what preserves short-circuit: an unevaluated leaf never calls
    // its probe, so absent stays distinguishable from false.
    sites: [
      probeSiteContract.parse({ id, kind: 'cond', start: condition.getStart(), end: condition.getEnd() }),
    ],
  };
};
