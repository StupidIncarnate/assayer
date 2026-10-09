/**
 * PURPOSE: One planned specimen before it is rendered: which focus goes into which container slot,
 * how its holes are filled, and which leaf varies. Reach for this when rendering, predicting and
 * writing the manifest from the same plan. It is types-only because it holds TypeScript nodes.
 *
 * USAGE:
 * const plan: SpecimenPlan = planFromTransformer;
 * plan.path;
 * // Returns hole names and node labels down to the varying leaf, such as ['cond', 'gt-number', 'value']
 */
import type { ContainerSlot } from '../container-slot/container-slot-contract';
import type { FillTree } from '../fill-tree/fill-tree-contract';
import type { LoadedContainer } from '../loaded-container/loaded-container-contract';
import type { Provenance } from '../provenance/provenance-contract';
import type { SyntaxInstance } from '../syntax-instance/syntax-instance-contract';

export interface SpecimenPlan {
  focus: SyntaxInstance;
  container: LoadedContainer;
  slot: ContainerSlot;
  tree: FillTree;
  path: readonly string[];
  provenance: Provenance;
  folder: string;
  entryName: string;
}
