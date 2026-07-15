/**
 * PURPOSE: Handles a `switch` — emits one eq-branch per literal case and descends each clause with
 *   that case's guard appended. The `default` clause is guarded by the ELSE of every case at once,
 *   which is what lets case derivation intersect those constraints down to the single uncovered
 *   member of a union.
 *
 *   In TAIL position a clause that does not return is itself an exit — it falls out of the switch,
 *   and nothing runs after it — so it gets a guarded completion exit, exactly as an `if` arm does.
 *
 *   Note what it does NOT do: hardcode its guard path. The old analyzer emitted switch exits with a
 *   guard of exactly one step, so a `switch` inside an `if` silently lost the `if` — a real bug that
 *   this handler cannot reproduce, because it appends to the guard the walk already carried down
 *   rather than inventing one.
 *
 * USAGE:
 * handleSwitchLayerAdapter({ node: switchStatement, context });
 * // Returns a HandlerResult with one branch per literal case and per-clause descents
 */
import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { desugarSwitchLayerAdapter } from './desugar-switch-layer-adapter';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';
import { readOperandTypeLayerAdapter } from './read-operand-type-layer-adapter';
import type { SwitchStatement } from 'ts-morph';

export const handleSwitchLayerAdapter = ({
  node,
  context,
}: {
  node: SwitchStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const desugared = desugarSwitchLayerAdapter({ switchStatement: node, scopePath: context.scopePath });
  const operandType = readOperandTypeLayerAdapter({
    node: desugared.discNode,
    context,
    ...(desugared.discName === undefined ? {} : { name: desugared.discName }),
  });

  const branches = desugared.caseInfos.map((caseInfo) =>
    branchNodeContract.parse({
      coverageId: caseInfo.branchCoverageId,
      kind: 'switch',
      ...(desugared.discName === undefined ? {} : { operandParamName: desugared.discName }),
      operandType,
      predicate: { kind: 'eq', literal: caseInfo.literalValue },
      startLine: caseInfo.clause.getStartLineNumber(),
      endLine: caseInfo.clause.getEndLineNumber(),
    }),
  );

  // `default` runs only when every case missed it, so it carries the else of all of them.
  const defaultGuards = desugared.caseInfos.map((caseInfo) =>
    guardStepContract.parse({ branchCoverageId: caseInfo.branchCoverageId, arm: 'else' }),
  );

  const clauses = [
    ...desugared.caseInfos.map((caseInfo) => ({
      statements: caseInfo.clause.getStatements(),
      start: caseInfo.clause.getStartLineNumber(),
      guards: [guardStepContract.parse({ branchCoverageId: caseInfo.branchCoverageId, arm: 'then' })],
    })),
    ...(desugared.defaultClause === undefined
      ? []
      : [
          {
            statements: desugared.defaultClause.getStatements(),
            start: desugared.defaultClause.getStartLineNumber(),
            guards: defaultGuards,
          },
        ]),
  ];

  const descents = clauses.flatMap((clause) =>
    handleBlockLayerAdapter({
      statements: clause.statements,
      context: walkContextTransformer({ context, guardSteps: clause.guards }),
    }).descents,
  );

  // Falling out of a clause only ENDS the scope when nothing runs after the `switch`.
  const completions = context.tail
    ? clauses.flatMap((clause) => {
        if (readAccountedLayerAdapter({ node: clause.statements.at(-1) })) {
          return [];
        }
        const guardPath = [...context.guardPath, ...clause.guards];
        return [
          exitNodeContract.parse({
            coverageId: exitCoverageIdTransformer({ kind: 'exit', guardPath, scopePath: context.scopePath }),
            kind: 'implicit',
            guardPath,
            line: clause.statements[0]?.getStartLineNumber() ?? clause.start,
          }),
        ];
      })
    : [];

  return handlerResultLayerAdapter({
    branches,
    exits: completions,
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: context.scopePath,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    descents,
  });
};
