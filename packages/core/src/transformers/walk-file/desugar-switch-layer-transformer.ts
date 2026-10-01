/**
 * PURPOSE: Desugars one `switch` into eq-branches — the discriminant's symbol name, one case info per
 *   `case` clause (its projection token, the coverage ID of the equivalent `discriminant === <case>`
 *   branch, and the case's literal VALUE when the parse can read one), plus the `default` clause. This
 *   is the ONE place a case clause is read, so no two callers can desugar a switch differently.
 *
 *   EVERY case clause yields an info, including one whose expression is not a literal (an enum member,
 *   an imported constant). Its `literalValue` is absent, so the branch it becomes carries no
 *   constraint and `derive-cases` admits it UNDRIVEN — which is honest. Skipping such a clause was
 *   not: the clause was never descended, its exits never emitted, and the `default` lost the else that
 *   guards it, so a case predicting the default reached the skipped clause's return instead and the
 *   run failed against correct code. Fallthrough is still not desugared.
 *
 * USAGE:
 * desugarSwitchLayerTransformer({ switchStatement, scopePath: ['*module*', 'routeLabel'] });
 * // Returns { discName: 'method', caseInfos: [{ clause, literalValue: 'get', caseToken: 'str:get', branchCoverageId }], defaultClause }
 */
import { Node } from '#gateway/npm/ts-morph';
import type { CaseClause, DefaultClause, SwitchStatement } from '#gateway/npm/ts-morph';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, SymbolName, Coverage } from '@assayer/shared/contracts';

import type { AstProjection } from '../../contracts/ast-projection/ast-projection-contract';
import { coverageIdTransformer } from '../coverage-id/coverage-id-transformer';
import { literalTokenTransformer } from '../literal-token/literal-token-transformer';
import { projectNodeLayerTransformer } from './project-node-layer-transformer';

export interface SwitchCaseInfo {
  clause: CaseClause;
  literalValue?: RepresentativeValue;
  caseToken: AstProjection;
  branchCoverageId: Coverage['id'];
}

export interface DesugaredSwitch {
  discName?: SymbolName;
  discNode: Node;
  caseInfos: SwitchCaseInfo[];
  defaultClause?: DefaultClause;
}

export const desugarSwitchLayerTransformer = ({
  switchStatement,
  scopePath,
}: {
  switchStatement: SwitchStatement;
  scopePath: SymbolName[];
}): DesugaredSwitch => {
  const discNode = switchStatement.getExpression();
  const discName = Node.isIdentifier(discNode) ? symbolNameContract.parse(discNode.getText()) : undefined;
  const discProjection = projectNodeLayerTransformer({ node: discNode });
  const clauses = switchStatement.getClauses();

  const caseInfos = clauses.flatMap((clause) => {
    if (!Node.isCaseClause(clause)) {
      return [];
    }
    const caseExpr = clause.getExpression();
    const literalValue =
      Node.isStringLiteral(caseExpr) || Node.isNumericLiteral(caseExpr)
        ? representativeValueContract.parse(caseExpr.getLiteralValue())
        : undefined;
    // The identity of the arm, literal or not. A literal keys on its VALUE through the one token
    // format; anything else keys on its structural projection, the same kinds-and-symbols identity
    // every other coverage ID uses — never its source text.
    const caseToken =
      literalValue === undefined
        ? projectNodeLayerTransformer({ node: caseExpr })
        : literalTokenTransformer({ value: literalValue });

    return [
      {
        clause,
        ...(literalValue === undefined ? {} : { literalValue }),
        caseToken,
        branchCoverageId: coverageIdTransformer({
          scopePath,
          segment: `switch:${discProjection},EqualsEqualsEqualsToken,${caseToken}`,
        }),
      },
    ];
  });

  const [defaultClause] = clauses.flatMap((clause) => (Node.isDefaultClause(clause) ? [clause] : []));

  return {
    ...(discName === undefined ? {} : { discName }),
    discNode,
    caseInfos,
    ...(defaultClause === undefined ? {} : { defaultClause }),
  };
};
