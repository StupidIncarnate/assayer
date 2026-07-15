/**
 * PURPOSE: Desugars one `switch` into eq-branches — the discriminant's symbol name, one case info per
 *   string/number literal `case` (its value, its projection token, and the coverage ID of the
 *   equivalent `discriminant === literal` branch), plus the `default` clause. This is the ONE place a
 *   case clause is read, so no two callers can desugar a switch differently.
 *   Non-literal cases (enum-member references) and fallthrough are not desugared yet — they are
 *   skipped rather than guessed at.
 *
 * USAGE:
 * desugarSwitchLayerAdapter({ switchStatement, scopePath: ['*module*', 'routeLabel'] });
 * // Returns { discName: 'method', caseInfos: [{ clause, literalValue: 'get', literalToken: 'str:get', branchCoverageId }], defaultClause }
 */
import { Node } from 'ts-morph';
import type { CaseClause, DefaultClause, SwitchStatement } from 'ts-morph';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';
import type { CoverageId, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { AstProjection } from '../../../contracts/ast-projection/ast-projection-contract';
import { coverageIdTransformer } from '../../../transformers/coverage-id/coverage-id-transformer';
import { literalTokenTransformer } from '../../../transformers/literal-token/literal-token-transformer';
import { projectNodeLayerAdapter } from './project-node-layer-adapter';

export interface SwitchCaseInfo {
  clause: CaseClause;
  literalValue: RepresentativeValue;
  literalToken: AstProjection;
  branchCoverageId: CoverageId;
}

export interface DesugaredSwitch {
  discName?: SymbolName;
  discNode: Node;
  caseInfos: SwitchCaseInfo[];
  defaultClause?: DefaultClause;
}

export const desugarSwitchLayerAdapter = ({
  switchStatement,
  scopePath,
}: {
  switchStatement: SwitchStatement;
  scopePath: SymbolName[];
}): DesugaredSwitch => {
  const discNode = switchStatement.getExpression();
  const discName = Node.isIdentifier(discNode) ? symbolNameContract.parse(discNode.getText()) : undefined;
  const discProjection = projectNodeLayerAdapter({ node: discNode });
  const clauses = switchStatement.getClauses();

  const caseInfos = clauses.flatMap((clause) => {
    if (!Node.isCaseClause(clause)) {
      return [];
    }
    const caseExpr = clause.getExpression();
    if (!Node.isStringLiteral(caseExpr) && !Node.isNumericLiteral(caseExpr)) {
      return [];
    }
    const literalValue = representativeValueContract.parse(caseExpr.getLiteralValue());
    const literalToken = literalTokenTransformer({ value: literalValue });
    return [
      {
        clause,
        literalValue,
        literalToken,
        branchCoverageId: coverageIdTransformer({
          scopePath,
          segment: `switch:${discProjection},EqualsEqualsEqualsToken,${literalToken}`,
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
