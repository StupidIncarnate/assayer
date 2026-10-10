/**
 * PURPOSE: Extracts all file relative paths from a TreeNode in depth-first search (DFS) order.
 *   Drives file list navigation (previous and next file buttons) in the compiled surface explorer.
 *
 * USAGE:
 * treeFilePathsTransformer({ node });
 * // Returns ['packages/app/src/index.ts', 'packages/app/src/app.tsx']
 */
import type { TreeNode } from '@assayer/shared/contracts';

export const treeFilePathsTransformer = ({
  node,
}: {
  node: TreeNode;
}): readonly string[] => {
  if (node.kind === 'file') {
    return [node.path];
  }

  const paths: string[] = [];
  for (const child of node.children ?? []) {
    paths.push(...treeFilePathsTransformer({ node: child }));
  }

  return paths;
};
