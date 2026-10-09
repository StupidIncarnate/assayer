/**
 * PURPOSE: Prepares a freshly parsed snippet node to be printed inside other code. It clears the
 * source positions, so the printer writes each node from its parts and never reads the snippet's
 * source text, and it rewrites every string literal with single quotes. It can also rename one
 * identifier, which is how an env leaf swaps the `KEY` placeholder for its own name. Reach for this
 * only on nodes a parse layer just made, because it changes them in place.
 *
 * USAGE:
 * synthesizeLayerTransformer({ node, rename: { from: 'KEY', to: 'VALUE' } });
 * // Returns the node with no positions, `KEY` replaced by `VALUE`, and single-quoted strings
 */
import ts from '#gateway/npm/typescript';

export const synthesizeLayerTransformer = ({
  node,
  rename,
}: {
  node: ts.Node;
  rename?: { from: string; to: string } | undefined;
}): ts.Node => {
  if (ts.isStringLiteral(node)) {
    return ts.factory.createStringLiteral(node.text, true);
  }
  if (rename !== undefined && ts.isIdentifier(node) && node.text === rename.from) {
    return ts.factory.createIdentifier(rename.to);
  }

  const visited = ts.visitEachChild(node, (child) => synthesizeLayerTransformer({ node: child, rename }), undefined);

  return ts.setTextRange(visited, { pos: -1, end: -1 });
};
