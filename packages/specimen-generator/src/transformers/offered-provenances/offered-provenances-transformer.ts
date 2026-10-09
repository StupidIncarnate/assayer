/**
 * PURPOSE: Picks, from the enabled provenances, the ones a slot can use: `params` needs a callable
 * that takes `$params`, `module-load` needs a slot that runs when the module loads, and `always`
 * fits every slot. Reach for this when planning which values a slot may be filled from.
 *
 * USAGE:
 * offeredProvenancesTransformer({ slot, enabled: ['param', 'env', 'literal'] });
 * // Returns ['param', 'literal'] for a slot inside a function that takes $params
 */
import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { provenanceStatics } from '../../statics/provenance/provenance-statics';

export const offeredProvenancesTransformer = ({
  slot,
  enabled,
}: {
  slot: ContainerSlot;
  enabled: readonly Provenance[];
}): Provenance[] =>
  enabled.filter((provenance) => {
    const { offered } = provenanceStatics[provenance];
    if (offered === 'params') {
      return slot.hasParams;
    }
    if (offered === 'module-load') {
      return slot.reach === 'module-load';
    }
    return true;
  });
