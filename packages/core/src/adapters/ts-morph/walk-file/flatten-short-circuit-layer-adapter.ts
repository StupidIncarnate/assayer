/**
 * PURPOSE: Flattens a left-associative `&&`/`||` spine of ONE operator into its ordered operand list.
 *   `a || b || c` parses as `((a || b) || c)`, so reading a single binary sees only two operands and
 *   would model the chain as one nested condition rather than three independent short-circuit paths.
 *   Walking down `.getLeft()` while the SAME operator holds — collecting each right operand, then the
 *   deepest left — yields `[a, b, c]` in source order, which is what lets `read-conditional-exit`
 *   emit one guarded exit per operand. Parentheses on a spine node are formatting, so `(a || b) || c`
 *   flattens identically to `a || b || c`; the spine stops at a DIFFERENT operator, which is then a
 *   single operand read as a leaf.
 *
 *   It recurses its OWN subtree (the left spine), never the walk — the core still walks the operands
 *   `read-conditional-exit` returns as descents.
 *
 * USAGE:
 * flattenShortCircuitLayerAdapter({ expression: orChain, operator: SyntaxKind.BarBarToken });
 * // Returns [a, b, c] — the operands in source order
 */
import type { SyntaxKind } from 'ts-morph';
import { Node } from 'ts-morph';

export const flattenShortCircuitLayerAdapter = ({
  expression,
  operator,
}: {
  expression: Node;
  operator: SyntaxKind;
}): Node[] => {
  const inner = Node.isParenthesizedExpression(expression) ? expression.getExpression() : expression;

  if (Node.isBinaryExpression(inner) && inner.getOperatorToken().getKind() === operator) {
    return [...flattenShortCircuitLayerAdapter({ expression: inner.getLeft(), operator }), inner.getRight()];
  }

  return [expression];
};
