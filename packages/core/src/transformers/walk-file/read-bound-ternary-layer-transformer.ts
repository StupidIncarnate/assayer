/**
 * PURPOSE: Reads a ternary whose value is BOUND to a name rather than leaving the scope: a parameter's
 *   default value (`label = cond ? 'a' : 'b'`). The ternary is a branch of the scope it sits in, its
 *   condition reads through the condition lens like any other, and each arm descends under its own
 *   guard step. It emits NO exit: the chosen arm's value flows on into the binding, and the scope's own
 *   exits are where execution leaves. Each arm is recorded as a fall-through arm instead, so an arm no
 *   value can enter is still reported. `read-conditional-exit` is the sibling for a ternary that IS an
 *   exit (`return cond ? a : b`), which splits it into one exit per arm instead.
 *
 *   A nested ternary in an arm is read the same way, under that arm's guard. Any other expression is
 *   handed back as one descent, so whatever it holds (a call, an arrow function) is still walked.
 *   Parentheses are formatting and are seen through.
 *
 * USAGE:
 * readBoundTernaryLayerTransformer({ expression: param.getInitializerOrThrow(), context });
 * // Returns a HandlerResult with one `ternary` branch, its leaf probe sites, and descents for the
 * //   condition and both arms; or one descent of the expression itself when it is not a ternary
 */
import { Node } from '#gateway/npm/ts-morph';

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

export const readBoundTernaryLayerTransformer = ({
  expression,
  context,
}: {
  expression: Node;
  context: WalkContext;
}): HandlerResult => {
  const ternary = unwrapParenthesesLayerTransformer({ node: expression });

  if (!Node.isConditionalExpression(ternary)) {
    return handlerResultLayerTransformer({ descents: [{ node: expression, context }] });
  }

  const condition = ternary.getCondition();
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
    { arm: 'then', armExpr: ternary.getWhenTrue() },
    { arm: 'else', armExpr: ternary.getWhenFalse() },
  ] as const;
  const armResults = arms.map(({ arm, armExpr }) => {
    const armContext = walkContextTransformer({
      context,
      guardSteps: [guardStepContract.parse({ branchCoverageId, arm })],
      tail: false,
    });
    const armResult = readBoundTernaryLayerTransformer({ expression: armExpr, context: armContext });

    // A leaf arm's value flows on into the binding, so the arm owns no exit and is recorded as a
    // fall-through arm. That record is what lets `derive-cases` report the arm when a welded constant
    // means nothing can enter it. A nested ternary arm records its own leaf arms instead.
    return Node.isConditionalExpression(unwrapParenthesesLayerTransformer({ node: armExpr }))
      ? armResult
      : {
          ...armResult,
          fallthroughArms: [
            fallthroughArmContract.parse({
              guardPath: armContext.guardPath,
              startLine: armExpr.getStartLineNumber(),
              endLine: armExpr.getEndLineNumber(),
            }),
          ],
        };
  });

  return handlerResultLayerTransformer({
    branches: [
      branchNodeContract.parse({
        coverageId: branchCoverageId,
        kind: 'ternary',
        condition: readout.condition,
        startLine: ternary.getStartLineNumber(),
        endLine: ternary.getEndLineNumber(),
      }),
      ...armResults.flatMap((result) => result.branches),
    ],
    probeSites: [...readout.sites, ...armResults.flatMap((result) => result.probeSites)],
    fallthroughArms: armResults.flatMap((result) => result.fallthroughArms),
    nodes: [
      walkNodeContract.parse({
        kind: ternary.getKindName(),
        scopePath: context.scopePath,
        startLine: ternary.getStartLineNumber(),
        endLine: ternary.getEndLineNumber(),
        handled: true,
      }),
      ...armResults.flatMap((result) => result.nodes),
    ],
    // The condition runs before either arm is chosen, so it descends under the enclosing guards with
    // `tail` cleared, which routes a call in it to `handle-call`.
    descents: [
      { node: condition, context: walkContextTransformer({ context, tail: false }) },
      ...armResults.flatMap((result) => result.descents),
    ],
  });
};
