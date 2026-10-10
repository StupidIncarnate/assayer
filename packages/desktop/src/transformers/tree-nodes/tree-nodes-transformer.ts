/**
 * PURPOSE: Builds a nested file/directory tree (TreeNode[]) from a flat list of repo-relative
 *   paths. Each intermediate path segment becomes a 'dir' node with a `children` array; the final
 *   segment of each path becomes a 'file' node with the full relative path and no `children` key.
 *   When an optional `errorCountsByPath` map is supplied, file nodes with positive counts carry
 *   `errorCount`. Siblings at every level (including the root) are sorted ascending by name.
 *
 * USAGE:
 * treeNodesTransformer({ relPaths: ['packages/shared/src/index.ts'] });
 * // Returns [{ name: 'packages', path: 'packages', kind: 'dir', children: [...] }]
 */
import { compiledTreeContract } from '@assayer/shared/contracts';
import type { TreeNode } from '@assayer/shared/contracts';

const treeNodeContract = compiledTreeContract.shape.nodes.element;

export const treeNodesTransformer = ({
  relPaths,
  errorCountsByPath,
}: {
  relPaths: readonly string[];
  errorCountsByPath?: ReadonlyMap<string, number> | undefined;
}): TreeNode[] => {
  const roots: TreeNode[] = [];
  const childrenByPath = new Map<string, TreeNode[]>();

  for (const relPath of relPaths) {
    const segments = relPath.split('/');
    let siblings = roots;
    let accumulatedPath = '';

    for (const [index, segment] of segments.entries()) {
      accumulatedPath = accumulatedPath === '' ? segment : `${accumulatedPath}/${segment}`;
      const nodePath = accumulatedPath;

      if (index === segments.length - 1) {
        const errorCount = errorCountsByPath?.get(nodePath);
        siblings.push(
          treeNodeContract.parse({
            name: segment,
            path: nodePath,
            kind: 'file',
            ...(errorCount !== undefined && errorCount > 0 ? { errorCount } : {}),
          }),
        );
        continue;
      }

      const existingChildren = childrenByPath.get(nodePath);
      if (existingChildren !== undefined) {
        siblings = existingChildren;
        continue;
      }

      const dirNode = treeNodeContract.parse({
        name: segment,
        path: nodePath,
        kind: 'dir',
        children: [],
      });
      const children = dirNode.children ?? [];
      siblings.push(dirNode);
      childrenByPath.set(nodePath, children);
      siblings = children;
    }
  }

  roots.sort((a, b) => a.name.localeCompare(b.name));
  for (const children of childrenByPath.values()) {
    children.sort((a, b) => a.name.localeCompare(b.name));
  }

  return roots;
};
