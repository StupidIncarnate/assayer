/**
 * PURPOSE: Handles a ternary in a VALUE position: a call argument, a field or variable initializer, an
 *   object property, a `yield`, a parameter default, a nested condition, a JSX child. The ternary is a
 *   branch of the scope it sits in, its condition reads through the condition lens like any other, and
 *   each arm descends under its own guard step. It emits NO exit. The chosen arm's value flows on into
 *   the expression around it, so both arms meet again at the enclosing statement, and the scope's own
 *   exits are where execution leaves. Each arm is recorded as a fall-through arm instead, so an arm no
 *   value can enter is still reported.
 *
 *   `dispatch-node` routes every ternary the walk reaches here. A ternary that IS an exit
 *   (`return cond ? a : b`, a concise arrow body, a `const` that flows straight into a `return`) never
 *   reaches the walk as a node: `read-conditional-exit` consumes it first and splits it into one exit
 *   per arm, then descends only its condition and its arms.
 *
 *   A ternary in an arm is not read here. It descends with the arm, under the arm's guard, and the walk
 *   routes it back to this handler. Parentheses around an arm are formatting, so a parenthesized ternary
 *   arm is a ternary arm.
 *
 * USAGE:
 * handleTernaryLayerTransformer({ node: conditionalExpression, context });
 * // Returns a HandlerResult with one `ternary` branch, its leaf probe sites, a fall-through arm per
 * //   arm that is not itself a ternary, and descents for the condition and both arms
 */
import { Node } from '#gateway/npm/ts-morph';
import type { ConditionalExpression } from '#gateway/npm/ts-morph';

import { branchNodeContract, guardStepContract } from '@assayer/shared/contracts';

import { fallthroughArmContract } from '../../contracts/fallthrough-arm/fallthrough-arm-contract';
import type { HandlerResult } from '../../contracts/handler-result/handler-result-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { coverageIdTransformer } from '../coverage-id/coverage-id-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { projectNodeLayerTransformer } from './project-node-layer-transformer';
import { readConditionTreeLayerTransformer } from './read-condition-tree-layer-transformer';
import { unwrapParenthesesLayerTransformer } from './unwrap-parentheses-layer-transformer';

export const handleTernaryLayerTransformer = ({
  node,
  context,
}: {
  node: ConditionalExpression;
  context: WalkContext;
}): HandlerResult => {
  const condition = node.getCondition();
  // The same key an exit-position ternary uses: the condition's structural projection under a
  // `ternary:` segment, so reformatting the condition never moves it.
  const branchCoverageId = coverageIdTransformer({
    scopePath: context.scopePath,
    segment: `ternary:${projectNodeLayerTransformer({ node: condition })}`,
  });
  const readout = readConditionTreeLayerTransformer({ condition, context, branchCoverageId, path: [] });

  // `then`/`else` are load-bearing: `exit-causes` reads `want = arm !== 'else'`, so the else arm is the
  // violating side, exactly as an `if` reads it.
  const arms = [
    { arm: 'then', armExpr: node.getWhenTrue() },
    { arm: 'else', armExpr: node.getWhenFalse() },
  ] as const;
  const armDescents = arms.map(({ arm, armExpr }) => ({
    armExpr,
    context: walkContextTransformer({
      context,
      guardSteps: [guardStepContract.parse({ branchCoverageId, arm })],
      tail: false,
    }),
  }));

  return handlerResultLayerTransformer({
    branches: [
      branchNodeContract.parse({
        coverageId: branchCoverageId,
        kind: 'ternary',
        condition: readout.condition,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
      }),
    ],
    probeSites: readout.sites,
    // A leaf arm's value flows on into the expression around it, so the arm owns no exit. This record is
    // what lets `derive-cases` report the arm when a welded constant means nothing can enter it. A
    // ternary arm records nothing here: its own leaf arms record themselves when the walk reaches it.
    fallthroughArms: armDescents.flatMap(({ armExpr, context: armContext }) =>
      Node.isConditionalExpression(unwrapParenthesesLayerTransformer({ node: armExpr }))
        ? []
        : [
            fallthroughArmContract.parse({
              guardPath: armContext.guardPath,
              startLine: armExpr.getStartLineNumber(),
              endLine: armExpr.getEndLineNumber(),
            }),
          ],
    ),
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: context.scopePath,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    // The condition runs before either arm is chosen, so it descends under the enclosing guards with
    // `tail` cleared, which routes a call in it to `handle-call`. Each arm descends under its own guard.
    descents: [
      { node: condition, context: walkContextTransformer({ context, tail: false }) },
      ...armDescents.map(({ armExpr, context: armContext }) => ({ node: armExpr, context: armContext })),
    ],
  });
};
