/**
 * PURPOSE: Builds the leaf that fills one hole of one syntax instance. The leaf's value is the hole's
 * anchor when the declaration gives one, and the known value of the hole's type otherwise. Reach for
 * this inside the variant planner. A caller that wants a hole's default provenance uses
 * defaultFillLayerTransformer.
 *
 * USAGE:
 * leafLayerTransformer({ instance, hole: instance.holes[0], provenance: 'param' });
 * // Returns { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 }
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';
import { typeInfoTransformer } from '../type-info/type-info-transformer';

export const leafLayerTransformer = ({
  instance,
  hole,
  provenance,
}: {
  instance: SyntaxInstance;
  hole: SyntaxInstance['holes'][number];
  provenance: Provenance;
}): Extract<FillTree, { kind: 'leaf' }> => ({
  kind: 'leaf',
  owner: instance.syntax.name,
  hole: hole.name,
  type: hole.type,
  provenance,
  value: hole.name in instance.anchors ? instance.anchors[hole.name] : typeInfoTransformer({ typeText: hole.type }).known,
});
