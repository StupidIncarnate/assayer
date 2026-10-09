/**
 * PURPOSE: Lists every leaf in a fill tree, depth first, in the order the syntaxes declare their
 * holes. Reach for this when a caller needs the values a specimen is built from, such as the
 * provenance of each one.
 *
 * USAGE:
 * fillTreeLeavesTransformer({ tree });
 * // Returns the leaf of each hole, with a nested node's leaves in place of that node
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';

export const fillTreeLeavesTransformer = ({ tree }: { tree: FillTree }): Extract<FillTree, { kind: 'leaf' }>[] => {
  if (tree.kind === 'leaf') {
    return [tree];
  }

  return tree.instance.holes.flatMap(({ name }) => {
    const child = tree.holes[name];
    return child === undefined ? [] : fillTreeLeavesTransformer({ tree: child });
  });
};
