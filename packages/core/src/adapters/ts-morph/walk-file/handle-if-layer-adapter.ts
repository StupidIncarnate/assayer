/**
 * PURPOSE: Handles an `if` — emits its branch, then descends each arm with that arm's guard step
 *   APPENDED to whatever guard already reached it. That append is the entire composition story: an
 *   `if` inside a `switch` case inside another `if` needs no code here, because the enclosing guards
 *   are already in the context this handler extends. It never asks what encloses it.
 *
 *   In TAIL position each arm's completion is itself an exit (nothing runs after the `if`, so
 *   falling off the end of an arm ends the scope) and gets a guarded implicit exit — unless the arm
 *   already returns. That single rule is what makes a bare top-level `if` and an `if` inside a
 *   function the same handler instead of two near-copies.
 *
 * USAGE:
 * handleIfLayerAdapter({ node: ifStatement, context });
 * // Returns a HandlerResult with the branch, per-arm descents, and any completion exits
 */
import { Node } from 'ts-morph';
import type { IfStatement } from 'ts-morph';

import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { deriveBranchIdLayerAdapter } from './derive-branch-id-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';
import { readConditionTreeLayerAdapter } from './read-condition-tree-layer-adapter';

export const handleIfLayerAdapter = ({
  node,
  context,
}: {
  node: IfStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const coverageId = deriveBranchIdLayerAdapter({ node, scopePath: context.scopePath });
  const readout = readConditionTreeLayerAdapter({
    condition: node.getExpression(),
    context,
    branchCoverageId: coverageId,
    path: [],
  });

  const branch = branchNodeContract.parse({
    coverageId,
    kind: 'if',
    condition: readout.condition,
    startLine: node.getStartLineNumber(),
    endLine: node.getEndLineNumber(),
  });

  const thenStatement = node.getThenStatement();
  const elseStatement = node.getElseStatement();
  const thenStep = guardStepContract.parse({ branchCoverageId: coverageId, arm: 'then' });
  const elseStep = guardStepContract.parse({ branchCoverageId: coverageId, arm: 'else' });

  const arms =
    elseStatement === undefined
      ? [{ step: thenStep, statement: thenStatement }]
      : [
          { step: thenStep, statement: thenStatement },
          { step: elseStep, statement: elseStatement },
        ];

  // Falling off the end of an arm only ENDS the scope when nothing runs after the `if`.
  const completions = context.tail
    ? arms.flatMap(({ step, statement }) => {
        // An arm whose own ways out are already emitted (it returns, or it ends in an if/switch
        // that emitted its own completions) must not get a second exit stacked on top.
        if (readAccountedLayerAdapter({ node: statement })) {
          return [];
        }
        const guardPath = [...context.guardPath, step];
        const first = Node.isBlock(statement) ? statement.getStatements()[0] : statement;
        return [
          exitNodeContract.parse({
            coverageId: exitCoverageIdTransformer({ kind: 'exit', guardPath, scopePath: context.scopePath }),
            kind: 'implicit',
            guardPath,
            line: (first ?? statement).getStartLineNumber(),
          }),
        ];
      })
    : [];

  return handlerResultLayerAdapter({
    branches: [branch],
    exits: completions,
    probeSites: readout.sites,
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: context.scopePath,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    descents: arms.map(({ step, statement }) => ({
      node: statement,
      context: walkContextTransformer({ context, guardSteps: [step] }),
    })),
  });
};
