/**
 * PURPOSE: Recursively counts files in a compiled tree node — 1 for a file node itself, or the sum
 *   of all descendant files across children and grandchildren for a directory node. Drives the file
 *   count indicator rendered beside directory names in the file tree.
 *
 * USAGE:
 * treeFileCountTransformer({ node });
 * // Returns 42
 */
import type { TreeNode } from '@assayer/shared/contracts';

export const treeFileCountTransformer = ({
  node,
}: {
  node: TreeNode;
}): number => {
  if (node.kind === 'file') {
    return 1;
  }

  let total = 0;
  for (const child of node.children ?? []) {
    total += treeFileCountTransformer({ node: child });
  }

  return total;
};
