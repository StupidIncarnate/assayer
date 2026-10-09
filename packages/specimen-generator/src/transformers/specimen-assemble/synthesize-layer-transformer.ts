/**
 * PURPOSE: Prepares a freshly parsed snippet node to be printed inside other code. It clears the
 * source positions, so the printer writes each node from its parts and never reads the snippet's
 * source text, and it rewrites every string literal with single quotes. Reach for this only on nodes
 * a parse layer just made, because it changes them in place.
 *
 * USAGE:
 * synthesizeLayerTransformer({ node });
 * // Returns the node with no positions and single-quoted strings
 */
import ts from '#gateway/npm/typescript';

export const synthesizeLayerTransformer = ({ node }: { node: ts.Node }): ts.Node => {
  if (ts.isStringLiteral(node)) {
    return ts.factory.createStringLiteral(node.text, true);
  }

  const visited = ts.visitEachChild(node, (child) => synthesizeLayerTransformer({ node: child }), undefined);

  return ts.setTextRange(visited, { pos: -1, end: -1 });
};
