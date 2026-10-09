/**
 * PURPOSE: Reads the two facts the manifest needs off a fill tree: every syntax and shim it uses,
 * and the provenance of every leaf. Reach for this before manifestEntryTransformer, which takes
 * these facts instead of the tree.
 *
 * Names come in first-seen order: a node's own syntax, then its holes in the order the syntax
 * declares them. A name appears once.
 *
 * USAGE:
 * fillTreeFactsTransformer({ tree });
 * // Returns { uses: ['if', 'gt'], provenances: ['param', 'literal'] }
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';

export const fillTreeFactsTransformer = ({
  tree,
}: {
  tree: FillTree;
}): { uses: string[]; provenances: Provenance[] } => {
  if (tree.kind === 'leaf') {
    return { uses: [], provenances: [tree.provenance] };
  }

  const children = tree.instance.holes.flatMap(({ name }) => {
    const child = tree.holes[name];
    return child === undefined ? [] : [fillTreeFactsTransformer({ tree: child })];
  });
  const names = [tree.instance.syntax.name, ...children.flatMap((child) => child.uses)];

  return {
    uses: names.filter((name, index) => names.indexOf(name) === index),
    provenances: children.flatMap((child) => child.provenances),
  };
};
