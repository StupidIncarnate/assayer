/**
 * PURPOSE: One `case` clause of a desugared `switch`: the clause node, its literal VALUE when the parse
 *   can read one, its identity token, and the coverage ID of the equivalent `discriminant === <case>`
 *   branch. `desugarSwitchLayerTransformer` builds one per clause. The clause is a live ts-morph node,
 *   which Zod cannot check, so this file holds a type and no schema.
 *
 * USAGE:
 * const info: SwitchCaseInfo = { clause, literalValue: 'get', caseToken: 'str:get', branchCoverageId };
 * // One entry of a DesugaredSwitch's caseInfos
 */
import type { CaseClause } from '#gateway/npm/ts-morph';

import type { Coverage, RepresentativeValue } from '@assayer/shared/contracts';

export interface SwitchCaseInfo {
  clause: CaseClause;
  literalValue?: RepresentativeValue;
  caseToken: string;
  branchCoverageId: Coverage['id'];
}
