/**
 * PURPOSE: Builds a node for a syntax instance in which one named hole takes the given fill and every
 * other hole takes its default. A hole with an anchor defaults to a literal leaf of that anchor. Any
 * other hole defaults to the first provenance in `plainest` that the slot offers for that hole's type. Reach for this
 * inside the variant planner, once it has chosen which hole varies.
 *
 * USAGE:
 * defaultFillLayerTransformer({ instance, varying: { hole: 'cond', fill }, plainest: ['param'], slot, enabled: ['param'] });
 * // Returns a node whose 'cond' hole holds `fill` and whose other holes hold default leaves
 */
import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';
import { offeredProvenancesTransformer } from '../offered-provenances/offered-provenances-transformer';
import { leafLayerTransformer } from './leaf-layer-transformer';

export const defaultFillLayerTransformer = ({
  instance,
  varying,
  plainest,
  slot,
  enabled,
}: {
  instance: SyntaxInstance;
  varying: { hole: string; fill: FillTree };
  plainest: readonly Provenance[];
  slot: ContainerSlot;
  enabled: readonly Provenance[];
}): FillTree => ({
  kind: 'node',
  instance,
  holes: Object.fromEntries(
    instance.holes.map((hole): [string, FillTree] => {
      if (hole.name === varying.hole) {
        return [hole.name, varying.fill];
      }
      if (hole.name in instance.anchors) {
        return [hole.name, leafLayerTransformer({ instance, hole, provenance: 'literal' })];
      }
      const offered = offeredProvenancesTransformer({ slot, enabled, holeType: hole.type });
      const provenance = plainest.find((candidate) => offered.includes(candidate));
      if (provenance === undefined) {
        throw new Error(
          `No plainest provenance is offered for hole '${hole.name}' of '${instance.label}' in slot '${slot.name}'. The slot offers [${offered.join(', ')}] and plainest is [${plainest.join(', ')}]. Add a provenance the slot offers to plainest in matrixStatics.`,
        );
      }
      return [hole.name, leafLayerTransformer({ instance, hole, provenance })];
    }),
  ),
});
