/**
 * PURPOSE: Lists every syntax node under a node, in source order, that passes a type guard. The
 * starting node is tested too, so it is in the result when it passes. Reach for it whenever a reader of
 * declarations needs all the calls, classes, properties or return statements inside a file or an arrow.
 *
 * USAGE:
 * collectNodesTransformer({ node: sourceFile, matches: ts.isReturnStatement });
 * // Returns every return statement in the file, first one first
 */
import ts from '#gateway/npm/typescript';

export const collectNodesTransformer = <Found extends ts.Node>({
  node,
  matches,
}: {
  node: ts.Node;
  matches: (candidate: ts.Node) => candidate is Found;
}): Found[] => {
  const children: ts.Node[] = [];
  ts.forEachChild(node, (child) => {
    children.push(child);
  });

  return [
    ...(matches(node) ? [node] : []),
    ...children.flatMap((child) => collectNodesTransformer({ node: child, matches })),
  ];
};
