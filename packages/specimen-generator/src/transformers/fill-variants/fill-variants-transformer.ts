/**
 * PURPOSE: Lists every way to fill the holes of a focus syntax so that exactly one leaf varies. Each
 * hole without an anchor varies once per provenance the slot offers. When depth allows, it also
 * varies once through every other expression syntax that returns the hole's type, and that syntax's
 * own holes vary in turn. Every hole that does not vary takes its default fill. Reach for this when
 * planning specimens for one focus in one slot. Rendering the trees is a separate job.
 *
 * Order is fixed: holes in declared order, then provenances in the order of `enabled`, then fills in
 * the order of `instances`.
 *
 * USAGE:
 * fillVariantsTransformer({ focus, depth: 1, slot, instances, enabled: ['param', 'literal'], plainest: ['param'], excludedFills: [] });
 * // Returns [{ tree, path: ['cond'], provenance: 'param' }, ...]
 */
import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';
import { offeredProvenancesTransformer } from '../offered-provenances/offered-provenances-transformer';
import { defaultFillLayerTransformer } from './default-fill-layer-transformer';
import { leafLayerTransformer } from './leaf-layer-transformer';

export const fillVariantsTransformer = ({
  focus,
  depth,
  slot,
  instances,
  enabled,
  plainest,
  excludedFills,
}: {
  focus: SyntaxInstance;
  depth: number;
  slot: ContainerSlot;
  instances: readonly SyntaxInstance[];
  enabled: readonly Provenance[];
  plainest: readonly Provenance[];
  excludedFills: readonly string[];
}): { tree: FillTree; path: string[]; provenance: Provenance }[] => {
  return focus.holes.flatMap((hole) => {
    if (hole.name in focus.anchors) {
      return [];
    }

    const offered = offeredProvenancesTransformer({ slot, enabled, holeType: hole.type });
    const leaves = offered.map((provenance) => ({
      tree: defaultFillLayerTransformer({
        instance: focus,
        varying: { hole: hole.name, fill: leafLayerTransformer({ instance: focus, hole, provenance }) },
        plainest,
        slot,
        enabled,
      }),
      path: [hole.name],
      provenance,
    }));

    if (depth <= 0) {
      return leaves;
    }

    // A node never fills its own hole, which would write `!!flag` or `a ?? b ?? c`. A syntax with no
    // holes is a leaf, never a node.
    const nested = instances
      .filter(
        (candidate) =>
          candidate.syntax.kind === 'expression' &&
          candidate.syntax.name !== focus.syntax.name &&
          candidate.returnType === hole.type &&
          candidate.holes.length > 0 &&
          !excludedFills.includes(candidate.syntax.name),
      )
      .flatMap((candidate) =>
        fillVariantsTransformer({
          focus: candidate,
          depth: depth - 1,
          slot,
          instances,
          enabled,
          plainest,
          excludedFills,
        }).map((sub) => ({
          tree: defaultFillLayerTransformer({
            instance: focus,
            varying: { hole: hole.name, fill: sub.tree },
            plainest,
            slot,
            enabled,
          }),
          path: [hole.name, candidate.label, ...sub.path],
          provenance: sub.provenance,
        })),
      );

    return [...leaves, ...nested];
  });
};
