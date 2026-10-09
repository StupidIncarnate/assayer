/**
 * PURPOSE: Says whether some node in a fill tree has every one of its holes filled by a literal leaf.
 * Good code never writes an operation whose inputs are all literals, because it would write the result
 * instead. The planner drops those trees, so reach for this to find them.
 *
 * USAGE:
 * hasAllLiteralNodeGuard({ tree });
 * // Returns true when a node such as `3 > 5` has only literal inputs, anywhere in the tree
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';

export const hasAllLiteralNodeGuard = ({ tree }: { tree?: FillTree }): boolean => {
  if (tree === undefined || tree.kind === 'leaf') {
    return false;
  }

  const children = Object.values(tree.holes);

  return (
    children.every((child) => child.kind === 'leaf' && child.provenance === 'literal') ||
    children.some((child) => hasAllLiteralNodeGuard({ tree: child }))
  );
};
