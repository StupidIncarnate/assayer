/**
 * PURPOSE: Every syntax node under a node, the node itself included, that a test function accepts, in
 * source order. Syntax-shape reads `code` properties, `$arm` calls and `return` statements with it.
 *
 * USAGE:
 * findAllLayerTransformer({ node: sourceFile, predicate: ts.isReturnStatement });
 * // Returns every return statement in the file, first one first
 */
import ts from '#gateway/npm/typescript';

export const findAllLayerTransformer = <Found extends ts.Node>({
  node,
  predicate,
}: {
  node: ts.Node;
  predicate: (node: ts.Node) => node is Found;
}): Found[] => {
  const children: ts.Node[] = [];
  ts.forEachChild(node, (child) => {
    children.push(child);
  });

  return [
    ...(predicate(node) ? [node] : []),
    ...children.flatMap((child) => findAllLayerTransformer({ node: child, predicate })),
  ];
};
