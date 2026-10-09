/**
 * PURPOSE: Says whether a function written as an expression is called right where it is written, such
 * as `(() => { ... })()`. Assayer admits such a function as a whole scope on its own first line, where
 * it admits a named function once per branch, so the predictor needs to tell the two apart.
 *
 * USAGE:
 * isCalledInPlaceGuard({ node });
 * // Returns true when the node, past any parentheses, is the callee of a call
 */
import { Node } from '#gateway/npm/ts-morph';

export const isCalledInPlaceGuard = ({ node }: { node?: Node }): boolean => {
  const parent = node?.getParent();

  if (node === undefined || parent === undefined) {
    return false;
  }
  if (Node.isParenthesizedExpression(parent)) {
    return isCalledInPlaceGuard({ node: parent });
  }

  return Node.isCallExpression(parent) && parent.getExpression() === node;
};
