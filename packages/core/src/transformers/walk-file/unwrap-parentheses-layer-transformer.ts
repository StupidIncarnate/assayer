/**
 * PURPOSE: Returns the expression inside any number of redundant parentheses, so `((a))` reads as
 *   `a`. Parentheses are formatting, and a reader that names an operand by its node kind must see
 *   through them, or adding a pair would change what the analysis says.
 *
 * USAGE:
 * unwrapParenthesesLayerTransformer({ node: binary.getLeft() });
 * // Returns the Identifier `a` for `(a)`, and the node itself when it has no parentheses
 */
import { Node } from '#gateway/npm/ts-morph';

export const unwrapParenthesesLayerTransformer = ({ node }: { node: Node }): Node =>
  Node.isParenthesizedExpression(node) ? unwrapParenthesesLayerTransformer({ node: node.getExpression() }) : node;
