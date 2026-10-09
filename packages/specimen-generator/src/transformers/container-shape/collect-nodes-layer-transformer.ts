/**
 * PURPOSE: Lists every syntax node under a node, in source order, that passes a type guard. It
 * searches the whole subtree and leaves out the starting node itself. Reach for it when the
 * container reader needs all the calls, classes or properties inside a `code` arrow.
 *
 * USAGE:
 * collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression });
 * // Returns every call expression in the file
 */
import ts from '#gateway/npm/typescript';

export const collectNodesLayerTransformer = <T extends ts.Node>({
  node,
  matches,
}: {
  node: ts.Node;
  matches: (candidate: ts.Node) => candidate is T;
}): T[] => {
  const found: T[] = [];
  ts.forEachChild(node, (child) => {
    if (matches(child)) {
      found.push(child);
    }
    found.push(...collectNodesLayerTransformer({ node: child, matches }));
  });
  return found;
};
