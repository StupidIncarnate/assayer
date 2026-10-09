/**
 * PURPOSE: Reads whether one expression is the SHAPE of an unset guard, a ternary that keeps an
 *   `undefined` operand `undefined` and runs something else otherwise: `x === undefined ? undefined :
 *   <arm>`, or `x !== undefined ? <arm> : undefined`, with `undefined` on either side of the
 *   comparison. It answers the compared expression and the arm, and nothing more. `read-env-chain` is
 *   its only caller, and decides whether both halves read the same environment variable.
 *
 *   Only a strict comparison reads. `x == undefined` is also true for `null`, which is a different
 *   test. `undefined` must be the global (`is-global-undefined`), on both the comparison and the arm.
 *
 * USAGE:
 * readEnvGuardLayerTransformer({ node: initializer });
 * // Returns { tested: process.env.V, setArm: Number(process.env.V) } for
 * //   `process.env.V === undefined ? undefined : Number(process.env.V)`, or undefined
 */
import { Node, SyntaxKind } from '#gateway/npm/ts-morph';

import type { EnvGuardShape } from '../../contracts/env-guard-shape/env-guard-shape-contract';
import { isGlobalUndefinedGuard } from '../../guards/is-global-undefined/is-global-undefined-guard';
import { unwrapParenthesesLayerTransformer } from './unwrap-parentheses-layer-transformer';

export const readEnvGuardLayerTransformer = ({ node }: { node: Node }): EnvGuardShape | undefined => {
  if (!Node.isConditionalExpression(node)) {
    return undefined;
  }

  const condition = unwrapParenthesesLayerTransformer({ node: node.getCondition() });

  if (!Node.isBinaryExpression(condition)) {
    return undefined;
  }

  const operator = condition.getOperatorToken().getKind();

  if (operator !== SyntaxKind.EqualsEqualsEqualsToken && operator !== SyntaxKind.ExclamationEqualsEqualsToken) {
    return undefined;
  }

  const left = condition.getLeft();
  const right = condition.getRight();
  const tested = isGlobalUndefinedGuard({ node: right }) ? left : isGlobalUndefinedGuard({ node: left }) ? right : undefined;
  const [unsetArm, setArm] =
    operator === SyntaxKind.EqualsEqualsEqualsToken ? [node.getWhenTrue(), node.getWhenFalse()] : [node.getWhenFalse(), node.getWhenTrue()];

  return tested === undefined || !isGlobalUndefinedGuard({ node: unwrapParenthesesLayerTransformer({ node: unsetArm }) })
    ? undefined
    : { tested, setArm };
};
