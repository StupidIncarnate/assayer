/**
 * PURPOSE: Lists the parameters a value expression reads, in the order it first reads them, each once.
 *   An expression that reads only parameters the entry is called with can be steered by a case; one that
 *   reads anything else cannot, so `derive-cases` asks this before it calls a flow leaf steerable.
 *
 * USAGE:
 * valueExprParamsTransformer({ expr: { kind: 'select', branch: 'f/ternary:x', then: { kind: 'param', name: 'n' }, else: { kind: 'lit', value: 'NoneTon' } } });
 * // Returns ['n']
 */
import type { ValueExpr } from '@assayer/shared/contracts';

export const valueExprParamsTransformer = ({ expr }: { expr: ValueExpr }): string[] => {
  const names =
    expr.kind === 'param'
      ? [expr.name]
      : expr.kind === 'lit'
        ? []
        : expr.kind === 'select'
          ? [...valueExprParamsTransformer({ expr: expr.then }), ...valueExprParamsTransformer({ expr: expr.else })]
          : [...valueExprParamsTransformer({ expr: expr.receiver }), ...expr.args.flatMap((argument) => valueExprParamsTransformer({ expr: argument }))];

  return [...new Set(names)];
};
