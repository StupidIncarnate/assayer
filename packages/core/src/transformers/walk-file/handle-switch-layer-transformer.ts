/**
 * PURPOSE: Handles a `switch` — emits one branch per `case` clause and descends each clause with that
 *   case's guard appended. The `default` clause is guarded by the ELSE of every case at once, which is
 *   what lets case derivation intersect those constraints down to the single uncovered member of a
 *   union. A case whose expression the parse cannot read as a literal still gets its branch, carrying
 *   an `unrecognized` predicate, so its clause is descended and its exits are emitted; the derivation
 *   then admits that branch UNDRIVEN rather than mistaking the switch for a smaller one.
 *
 *   In TAIL position a clause that does not return is itself an exit — it falls out of the switch,
 *   and nothing runs after it — so it gets a guarded completion exit, exactly as an `if` arm does.
 *   That applies only when a `default` clause exists: with none, every clause's fallthrough and the
 *   wholly-unmatched path continue into the exact same code — whatever follows the whole `switch` —
 *   which the enclosing scope already probes as its own unaccounted-for exit (`read-accounted`
 *   reports a default-less `switch` as unaccounted for precisely so the enclosing scope owns that
 *   probe). A `default` present makes every clause mutually exclusive AND jointly exhaustive, so each
 *   keeps its own disjoint completion; the `if` twin of this rule is in `handle-if`.
 *
 *   Note what it does NOT do: hardcode its guard path. The old analyzer emitted switch exits with a
 *   guard of exactly one step, so a `switch` inside an `if` silently lost the `if` — a real bug that
 *   this handler cannot reproduce, because it appends to the guard the walk already carried down
 *   rather than inventing one.
 *
 * USAGE:
 * handleSwitchLayerTransformer({ node: switchStatement, context });
 * // Returns a HandlerResult with one branch per literal case and per-clause descents
 */
import { Node } from '#gateway/npm/ts-morph';

import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { envOperandKeyTransformer } from '../env-operand-key/env-operand-key-transformer';
import { envStepsTypeTransformer } from '../env-steps-type/env-steps-type-transformer';
import { exitCoverageIdTransformer } from '../exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { desugarSwitchLayerTransformer } from './desugar-switch-layer-transformer';
import { handleBlockLayerTransformer } from './handle-block-layer-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { readAccountedLayerTransformer } from './read-accounted-layer-transformer';
import { readConstOperandLayerTransformer } from './read-const-operand-layer-transformer';
import { readEnvOperandLayerTransformer } from './read-env-operand-layer-transformer';
import { readOperandTypeLayerTransformer } from './read-operand-type-layer-transformer';
import type { SwitchStatement } from '#gateway/npm/ts-morph';

export const handleSwitchLayerTransformer = ({
  node,
  context,
}: {
  node: SwitchStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerTransformer> => {
  const desugared = desugarSwitchLayerTransformer({ switchStatement: node, scopePath: context.scopePath });
  // WHERE the discriminant's value came from, read exactly as an `if` reads its operand — so a
  // module-scope switch on `Number(process.env.X)` is DRIVEN by setting X before import, not admitted
  // undriven. A param or a welded const reads as no env source and this stays undefined. An env read
  // also decides the discriminant's type, exactly as `build-condition-leaf` decides an operand's.
  const envRead = readEnvOperandLayerTransformer({ node: desugared.discNode });
  const operandType =
    envRead === undefined
      ? readOperandTypeLayerTransformer({
          node: desugared.discNode,
          context,
          ...(desugared.discName === undefined ? {} : { name: desugared.discName }),
        })
      : envStepsTypeTransformer({ steps: envRead.steps });
  // Whether the discriminant is welded to a same-file `const` — evaluated, not steered, exactly as an
  // `if` operand is: the case whose literal matches is live and the rest are unreachable exits.
  const constOperand = readConstOperandLayerTransformer({ node: desugared.discNode });
  // A discriminant that reads the environment in place (`switch (process.env.MODE)`) has no name of
  // its own, so it is named by the read and its steps, exactly as an `if` operand read in place is.
  const operandParamName =
    desugared.discName ?? (envRead === undefined ? undefined : envOperandKeyTransformer({ name: envRead.name, steps: envRead.steps }));

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
        ...(operandParamName === undefined ? {} : { operandParamName }),
        ...(envRead === undefined ? {} : { operandEnvVarName: envRead.name }),
        ...(envRead === undefined || envRead.steps.length === 0 ? {} : { operandEnvSteps: envRead.steps }),
        ...(constOperand?.value === undefined ? {} : { operandConstValue: constOperand.value }),
        operandType,
        // A case the parse could read as a literal is an equality on that value. One it could not
        // (`case Sev.Low:`) names no value, so the predicate is `unrecognized` and the branch is
        // admitted UNDRIVEN — never an equality against a value nobody has.
        predicate: caseInfo.literalValue === undefined ? { kind: 'unrecognized' } : { kind: 'eq', literal: caseInfo.literalValue },
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
    handleBlockLayerTransformer({
      statements: clause.statements,
      context: walkContextTransformer({ context, guardSteps: clause.guards }),
    }).descents,
  );

  // Falling out of a clause only ENDS the scope when nothing runs after the `switch`. And only when
  // there IS a `default`: with none, every clause's fallthrough and the wholly-unmatched path
  // converge on the exact same physical continuation — whatever follows the whole `switch` — which
  // the enclosing scope already probes as its own unaccounted-for exit (`read-accounted` reports a
  // default-less `switch` as unaccounted for precisely so the enclosing scope owns that probe).
  // Minting a per-clause completion here too would fire twice on one execution — the taken clause's
  // own probe, then the enclosing one right behind it — so a case predicting only this handler's exit
  // never matches the observed suffix and fails against correct code. A `default` present makes every
  // clause mutually exclusive AND jointly exhaustive, so each keeps its own disjoint completion.
  const completions = context.tail && desugared.defaultClause !== undefined
    ? clauses.flatMap((clause) => {
        if (readAccountedLayerTransformer({ node: clause.statements.at(-1) })) {
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

  return handlerResultLayerTransformer({
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
