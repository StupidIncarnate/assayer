/**
 * PURPOSE: Answers the bindings in effect after ONE write to a variable: the variable's old binding is
 *   dropped, and when the written value can be expressed over the scope's parameters the variable holds
 *   it from then on. A variable some write the walk does not follow can change is never tracked, and a
 *   value that cannot be expressed leaves the variable with no binding, so nothing after it reads a
 *   stale value. The variable is keyed by where it is declared, never by its spelling.
 *
 * USAGE:
 * assignBindingLayerTransformer({ before, declaration, value, scopePath, paramNames });
 * // Returns { '123': { kind: 'lit', value: 'b' } } for `data = 'b'` when `data` is declared at 123
 */
import type { Node as TsNode } from '#gateway/npm/ts-morph';
import type { ValueExpr } from '@assayer/shared/contracts';

import { readValueExprLayerTransformer } from './read-value-expr-layer-transformer';
import { readWriteTrackingLayerTransformer } from './read-write-tracking-layer-transformer';

export const assignBindingLayerTransformer = ({
  before,
  declaration,
  value,
  scopePath,
  paramNames,
}: {
  before: Record<string, ValueExpr>;
  declaration: TsNode;
  value: TsNode | undefined;
  scopePath: Parameters<typeof readValueExprLayerTransformer>[0]['scopePath'];
  paramNames: ReadonlySet<string>;
}): Record<string, ValueExpr> => {
  const key = String(declaration.getPos());
  const rest = Object.fromEntries(Object.entries(before).filter(([name]) => name !== key));

  if (value === undefined || !readWriteTrackingLayerTransformer({ declaration })) {
    return rest;
  }

  const expression = readValueExprLayerTransformer({ node: value, scopePath, paramNames, bindings: before });

  return expression === undefined ? rest : { ...rest, [key]: expression };
};
