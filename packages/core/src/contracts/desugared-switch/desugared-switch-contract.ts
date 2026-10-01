/**
 * PURPOSE: A `switch` read as eq-branches: the discriminant node and its symbol name, one
 *   SwitchCaseInfo per `case` clause, and the `default` clause when there is one.
 *   `desugarSwitchLayerTransformer` returns this. It holds live ts-morph nodes, which Zod cannot
 *   check, so this file holds a type and no schema.
 *
 * USAGE:
 * const desugared: DesugaredSwitch = desugarSwitchLayerTransformer({ switchStatement, scopePath });
 * // Returns { discName: 'method', discNode, caseInfos: [...], defaultClause }
 */
import type { DefaultClause, Node } from '#gateway/npm/ts-morph';

import type { SwitchCaseInfo } from '../switch-case-info/switch-case-info-contract';

export interface DesugaredSwitch {
  discName?: string;
  discNode: Node;
  caseInfos: SwitchCaseInfo[];
  defaultClause?: DefaultClause;
}
