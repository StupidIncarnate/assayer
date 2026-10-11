/**
 * PURPOSE: Evaluates a resolved value expression (no `select` left) once every parameter it names has a
 *   value. The answer is a one-field object holding the value, or `undefined` when the expression cannot
 *   be evaluated: a parameter with no value, a `select` that was never resolved, a string method applied
 *   to something that is not a string, or an argument that is not a number. An object is returned because
 *   `null` is itself a value an expression can hold.
 *
 *   Each method runs as the language runs it, so `slice(1, -1)` of `'None'` is `'on'`.
 *
 * USAGE:
 * valueExprEvaluateTransformer({ expr: { kind: 'method', name: 'slice', receiver: { kind: 'param', name: 'x' }, args: [{ kind: 'lit', value: 1 }, { kind: 'lit', value: -1 }] }, params: new Map([['x', 'None']]) });
 * // Returns { value: 'on' }
 */
import type { RepresentativeValue, ValueExpr } from '@assayer/shared/contracts';

export const valueExprEvaluateTransformer = ({
  expr,
  params,
}: {
  expr: ValueExpr;
  params: ReadonlyMap<string, RepresentativeValue>;
}): { value: RepresentativeValue } | undefined => {
  if (expr.kind === 'lit') {
    return { value: expr.value };
  }

  if (expr.kind === 'param') {
    return params.has(expr.name) ? { value: params.get(expr.name) ?? null } : undefined;
  }

  if (expr.kind === 'select') {
    return undefined;
  }

  const receiver = valueExprEvaluateTransformer({ expr: expr.receiver, params });
  const args = expr.args.map((argument) => valueExprEvaluateTransformer({ expr: argument, params }));

  if (
    receiver === undefined ||
    typeof receiver.value !== 'string' ||
    args.some((argument) => argument === undefined || typeof argument.value !== 'number')
  ) {
    return undefined;
  }

  const text = receiver.value;
  const [first, second] = args.map((argument) => (typeof argument?.value === 'number' ? argument.value : undefined));

  switch (expr.name) {
    case 'slice':
      return { value: text.slice(first, second) };
    case 'substring':
      return { value: text.substring(first ?? 0, second) };
    case 'toLowerCase':
      return { value: text.toLowerCase() };
    case 'toUpperCase':
      return { value: text.toUpperCase() };
    case 'trim':
    default:
      return { value: text.trim() };
  }
};
