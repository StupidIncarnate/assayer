/**
 * PURPOSE: Lists the name of every syntax and shim a fill tree uses, focus first, each name once, in
 * the order it is first seen. A node's own name comes before the names under its holes, which are read
 * in the order the syntax declares them. Reach for this to tell a reader which declaration files built
 * a specimen.
 *
 * USAGE:
 * fillTreeUsesTransformer({ tree });
 * // Returns ['if', 'gt'] for an `if` whose condition is a `gt`
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';

export const fillTreeUsesTransformer = ({ tree }: { tree: FillTree }): string[] => {
  if (tree.kind === 'leaf') {
    return [];
  }

  const names = [
    tree.instance.syntax.name,
    ...tree.instance.holes.flatMap(({ name }) => {
      const child = tree.holes[name];
      return child === undefined ? [] : fillTreeUsesTransformer({ tree: child });
    }),
  ];

  return names.filter((name, index) => names.indexOf(name) === index);
};
