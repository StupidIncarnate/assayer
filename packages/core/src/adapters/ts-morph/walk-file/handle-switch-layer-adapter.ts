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
import { Node } from 'ts-morph';

import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { desugarSwitchLayerAdapter } from './desugar-switch-layer-adapter';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';
import { readEnvOperandLayerAdapter } from './read-env-operand-layer-adapter';
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
  // WHERE the discriminant's value came from, read exactly as an `if` reads its operand — so a
  // module-scope switch on `Number(process.env.X)` is DRIVEN by setting X before import, not admitted
  // undriven. A param or a welded const reads as no env source and this stays undefined.
  const envVarName = readEnvOperandLayerAdapter({ node: desugared.discNode });

  // A `case` is already an equality test on one discriminant, so it IS a one-leaf condition tree —
  // the same shape an `if` builds, reached without a decomposition pass.
  //
  // These leaves get NO probe site, deliberately. `method === 'get'` is DESUGARED — it exists in the
  // analysis model but not in the source, so there is no expression to wrap. Exits inside the clauses
  // are still probed, so a switch runs and reports normally; only per-case condition ATTRIBUTION is
  // absent. Probing the discriminant once would recover it, and is a follow-on rather than a fudge.
  const branches = desugared.caseInfos.map((caseInfo) =>
    branchNodeContract.parse({
      coverageId: caseInfo.branchCoverageId,
      kind: 'switch',
      condition: {
        kind: 'leaf',
        id: `${caseInfo.branchCoverageId}#leaf`,
        ...(desugared.discName === undefined ? {} : { operandParamName: desugared.discName }),
        ...(envVarName === undefined ? {} : { operandEnvVarName: envVarName }),
        operandType,
        predicate: { kind: 'eq', literal: caseInfo.literalValue },
      },
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
        const exitId = exitCoverageIdTransformer({ kind: 'exit', guardPath, scopePath: context.scopePath });
        // The completion probe rides the last statement that is NOT the `break`: falling out happens
        // right after it, and a probe appended AFTER the break would be unreachable code that never
        // fires. A clause with no statement to hold it (only a bare `break`) cannot be observed.
        const probeTarget = clause.statements.filter((statement) => !Node.isBreakStatement(statement)).at(-1);
        return [
          {
            exit: exitNodeContract.parse({
              coverageId: exitId,
              kind: 'implicit',
              guardPath,
              line: clause.statements[0]?.getStartLineNumber() ?? clause.start,
            }),
            sites:
              probeTarget === undefined
                ? []
                : [probeSiteContract.parse({ id: exitId, kind: 'complete', start: probeTarget.getStart(), end: probeTarget.getEnd() })],
          },
        ];
      })
    : [];

  return handlerResultLayerAdapter({
    branches,
    exits: completions.map((completion) => completion.exit),
    probeSites: completions.flatMap((completion) => completion.sites),
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
