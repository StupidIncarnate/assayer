/**
 * PURPOSE: Lists the provenance of every leaf in a fill tree, in the order fillTreeLeavesTransformer
 * lists the leaves. A provenance says where a leaf's value comes from. Reach for this when a caller
 * needs a specimen's verdict, which these provenances decide.
 *
 * USAGE:
 * fillTreeProvenancesTransformer({ tree });
 * // Returns ['param', 'const'] for a tree whose leaves are a parameter, then a const
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { fillTreeLeavesTransformer } from '../fill-tree-leaves/fill-tree-leaves-transformer';

export const fillTreeProvenancesTransformer = ({ tree }: { tree: FillTree }): Provenance[] =>
  fillTreeLeavesTransformer({ tree }).map((leaf) => leaf.provenance);
