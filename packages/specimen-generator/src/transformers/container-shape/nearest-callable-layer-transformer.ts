/**
 * PURPOSE: Finds the closest function-like node around a node, looking upward and stopping at a
 * given ancestor. It answers undefined when no function sits between them, which is how a slot at
 * module level is told apart from a slot inside a function. The stop node must be an ancestor of
 * the node.
 *
 * USAGE:
 * nearestCallableLayerTransformer({ node: markerCall, stop: codeArrow });
 * // Returns the method declaration around the marker, or undefined at module level
 */
import ts from '#gateway/npm/typescript';

export const nearestCallableLayerTransformer = ({
  node,
  stop,
}: {
  node: ts.Node;
  stop: ts.Node;
}): ts.SignatureDeclaration | undefined => {
  const { parent } = node;
  if (parent === stop) {
    return undefined;
  }
  if (
    ts.isFunctionDeclaration(parent) ||
    ts.isFunctionExpression(parent) ||
    ts.isArrowFunction(parent) ||
    ts.isMethodDeclaration(parent) ||
    ts.isConstructorDeclaration(parent) ||
    ts.isGetAccessorDeclaration(parent)
  ) {
    return parent;
  }
  return nearestCallableLayerTransformer({ node: parent, stop });
};
