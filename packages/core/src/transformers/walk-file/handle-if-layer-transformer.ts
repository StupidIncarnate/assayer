/**
 * PURPOSE: Handles an `if` — emits its branch, then descends each arm with that arm's guard step
 *   APPENDED to whatever guard already reached it. That append is the entire composition story: an
 *   `if` inside a `switch` case inside another `if` needs no code here, because the enclosing guards
 *   are already in the context this handler extends. It never asks what encloses it.
 *
 *   In TAIL position each arm's completion is itself an exit (nothing runs after the `if`, so
 *   falling off the end of an arm ends the scope) and gets a guarded implicit exit — unless the arm
 *   already returns. That single rule is what makes a bare top-level `if` and an `if` inside a
 *   function the same handler instead of two near-copies. It applies only when there IS an else:
 *   the two arms are then mutually exclusive AND jointly exhaustive, so each owns a disjoint
 *   completion. With no else, the `then` arm's fallthrough and the missing else both continue into
 *   the exact same code — whatever follows the whole `if` — which the enclosing scope already probes
 *   as its own unaccounted-for exit (`read-accounted` reports an else-less `if` as unaccounted for
 *   precisely so the enclosing scope owns that probe); minting a second one here would fire twice on
 *   one execution and fail a case that predicted only one of them.
 *
 *   Each completion emits its PROBE SITE here too, from the same expression that mints the exit's id,
 *   for the same reason a leaf does: derive the sites in a second pass and the runtime observation
 *   could key under an id the analyzer never produced. The site is the ARM, because a completion has
 *   no expression to wrap — falling off the end is observable only by a statement at the position it
 *   happens.
 *
 * USAGE:
 * handleIfLayerTransformer({ node: ifStatement, context });
 * // Returns a HandlerResult with the branch, per-arm descents, and any completion exits
 */
import { Node } from '#gateway/npm/ts-morph';
import type { IfStatement } from '#gateway/npm/ts-morph';

import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { exitCoverageIdTransformer } from '../exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { deriveBranchIdLayerTransformer } from './derive-branch-id-layer-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { readAccountedLayerTransformer } from './read-accounted-layer-transformer';
import { readConditionTreeLayerTransformer } from './read-condition-tree-layer-transformer';

export const handleIfLayerTransformer = ({
  node,
  context,
}: {
  node: IfStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerTransformer> => {
  const coverageId = deriveBranchIdLayerTransformer({ node, scopePath: context.scopePath });
  const readout = readConditionTreeLayerTransformer({
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

  // Falling off the end of an arm only ENDS the scope when nothing runs after the `if`. And only
  // when there IS an else: with no else, the `then` arm's fallthrough and the missing else's own
  // path converge on the exact same physical continuation — whatever follows the whole `if` — so
  // minting a completion here as well as trusting the enclosing scope's own unaccounted-for
  // fallback (`read-accounted` on THIS if already reports `false` without an else, exactly because
  // it owes the reader an exit) would probe that one continuation twice. A real run takes both
  // probes in a single pass through the `then` arm, so a case predicting only this handler's exit
  // never matches the observed suffix and fails against correct code. Two mutually exclusive arms
  // (`elseStatement !== undefined`) have no such overlap: each gets its OWN disjoint completion, as
  // before.
  const completions = context.tail && elseStatement !== undefined
    ? arms.flatMap(({ step, statement }) => {
        // An arm whose own ways out are already emitted (it returns, or it ends in an if/switch
        // that emitted its own completions) must not get a second exit stacked on top.
        if (readAccountedLayerTransformer({ node: statement })) {
          return [];
        }
        const guardPath = [...context.guardPath, step];
        const first = Node.isBlock(statement) ? statement.getStatements()[0] : statement;
        const exitId = exitCoverageIdTransformer({ kind: 'exit', guardPath, scopePath: context.scopePath });
        return [
          {
            exit: exitNodeContract.parse({
              coverageId: exitId,
              kind: 'implicit',
              guardPath,
              line: (first ?? statement).getStartLineNumber(),
            }),
            // The arm itself: the probe is appended to it, because reaching its end IS the exit.
            site: probeSiteContract.parse({
              id: exitId,
              kind: 'complete',
              start: statement.getStart(),
              end: statement.getEnd(),
            }),
          },
        ];
      })
    : [];

  return handlerResultLayerTransformer({
    branches: [branch],
    exits: completions.map(({ exit }) => exit),
    probeSites: [...readout.sites, ...completions.map(({ site }) => site)],
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: context.scopePath,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    descents: [
      // The condition runs BEFORE either arm is chosen, so it descends under the enclosing guards —
      // never a then/else step — with `tail` cleared, because an expression can never end the scope.
      // This is what routes a call sited in the condition (`if (exceedsLimit(size))`) to handle-call
      // so the edge is recorded; reading the condition for its predicate alone marks the branch but
      // never the call inside it. An ordinary comparison descends through the no-op default and adds
      // nothing.
      { node: node.getExpression(), context: walkContextTransformer({ context, tail: false }) },
      ...arms.map(({ step, statement }) => ({
        node: statement,
        context: walkContextTransformer({ context, guardSteps: [step] }),
      })),
    ],
  });
};
