/**
 * PURPOSE: Picks, from the enabled provenances, the ones a hole in a slot can use: `params` needs a
 * callable that takes `$params`, `module-load` needs a slot that runs when the module loads, and
 * `always` fits every slot. Reach for this when planning which values a hole may be filled from.
 *
 * `env` is never offered for an array-typed hole. The array read is
 * `(process.env.KEY ?? '').split(',')`, and `''.split(',')` is `['']`, so the array is never empty.
 * A length check on it can only go one way, and the generator cannot predict that until shims are
 * callees. `external` stays offered for arrays.
 *
 * USAGE:
 * offeredProvenancesTransformer({ slot, enabled: ['param', 'env', 'literal'], holeType: 'number' });
 * // Returns ['param', 'literal'] for a slot inside a function that takes $params
 */
import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { provenanceStatics } from '../../statics/provenance/provenance-statics';

export const offeredProvenancesTransformer = ({
  slot,
  enabled,
  holeType,
}: {
  slot: ContainerSlot;
  enabled: readonly Provenance[];
  holeType: string;
}): Provenance[] =>
  enabled.filter((provenance) => {
    if (provenance === 'env' && /^readonly \w+\[\]$/u.test(holeType)) {
      return false;
    }
    const { offered } = provenanceStatics[provenance];
    if (offered === 'params') {
      return slot.hasParams;
    }
    if (offered === 'module-load') {
      return slot.reach === 'module-load';
    }
    return true;
  });
