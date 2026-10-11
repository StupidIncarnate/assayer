/**
 * PURPOSE: Resolves every `select` in a value expression by the arm a route took at that select's branch,
 *   leaving an expression of parameters, literals and string methods only. `undefined` means the route
 *   took no arm at a branch the expression depends on, so what the variable holds there is not decided.
 *
 * USAGE:
 * valueExprResolveTransformer({ expr: select, armByBranch: new Map([['f/ternary:x', 'else']]) });
 * // Returns { kind: 'lit', value: 'NoneTon' } for a select whose else arm is that literal
 */
import { valueExprContract } from '@assayer/shared/contracts';
import type { ValueExpr } from '@assayer/shared/contracts';

export const valueExprResolveTransformer = ({
  expr,
  armByBranch,
}: {
  expr: ValueExpr;
  armByBranch: ReadonlyMap<string, string>;
}): ValueExpr | undefined => {
  if (expr.kind === 'param' || expr.kind === 'lit') {
    return expr;
  }

  if (expr.kind === 'select') {
    const arm = armByBranch.get(expr.branch);

    return arm === 'then'
      ? valueExprResolveTransformer({ expr: expr.then, armByBranch })
      : arm === 'else'
        ? valueExprResolveTransformer({ expr: expr.else, armByBranch })
        : undefined;
  }

  const receiver = valueExprResolveTransformer({ expr: expr.receiver, armByBranch });
  const args = expr.args.map((argument) => valueExprResolveTransformer({ expr: argument, armByBranch }));

  return receiver === undefined || args.some((argument) => argument === undefined)
    ? undefined
    : valueExprContract.parse({ kind: 'method', name: expr.name, receiver, args });
};
