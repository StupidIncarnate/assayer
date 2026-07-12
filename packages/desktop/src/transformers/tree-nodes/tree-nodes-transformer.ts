/**
 * PURPOSE: Builds a nested file/directory tree (TreeNode[]) from a flat list of repo-relative
 *   paths. Each intermediate path segment becomes a 'dir' node with a `children` array; the final
 *   segment of each path becomes a 'file' node with the full relative path and no `children` key.
 *   Siblings at every level (including the root) are sorted ascending by name.
 *
 * USAGE:
 * treeNodesTransformer({ relPaths: [RelPathStub({ value: 'packages/shared/src/index.ts' })] });
 * // Returns [{ name: 'packages', path: 'packages', kind: 'dir', children: [...] }]
 */
import { relPathContract, treeNodeKindContract } from '@assayer/shared/contracts';
import type { RelPath, TreeNode } from '@assayer/shared/contracts';
import { treeNodeNameContract } from '../../contracts/tree-node-name/tree-node-name-contract';

export const treeNodesTransformer = ({ relPaths }: { relPaths: readonly RelPath[] }): TreeNode[] => {
  const roots: TreeNode[] = [];
  const childrenByPath = new Map<RelPath, TreeNode[]>();

  for (const relPath of relPaths) {
    const segments = relPath.split('/');
    let siblings = roots;
    let accumulatedPath = '';

    for (const [index, segment] of segments.entries()) {
      accumulatedPath = accumulatedPath === '' ? segment : `${accumulatedPath}/${segment}`;
      const nodePath = relPathContract.parse(accumulatedPath);

      if (index === segments.length - 1) {
        siblings.push({
          name: treeNodeNameContract.parse(segment),
          path: nodePath,
          kind: treeNodeKindContract.parse('file'),
        });
        continue;
      }

      const existingChildren = childrenByPath.get(nodePath);
      if (existingChildren !== undefined) {
        siblings = existingChildren;
        continue;
      }

      const children: TreeNode[] = [];
      siblings.push({
        name: treeNodeNameContract.parse(segment),
        path: nodePath,
        kind: treeNodeKindContract.parse('dir'),
        children,
      });
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
