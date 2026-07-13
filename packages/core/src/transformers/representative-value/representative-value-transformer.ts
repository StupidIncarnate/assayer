/**
 * PURPOSE: Picks a single deterministic representative value for a type descriptor — used to fill
 *   parameters no branch constrains and as the fallback for unrecognized predicates. Deterministic
 *   (never random) so generated cases are golden-stable, and sourced from the type, never from
 *   executing the code (P4).
 *
 * USAGE:
 * representativeValueTransformer({ type: { kind: 'string' } });
 * // Returns 'a' (branded RepresentativeValue)
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

export const representativeValueTransformer = ({ type }: { type: TypeDescriptor }): RepresentativeValue => {
  switch (type.kind) {
    case 'string':
      return representativeValueContract.parse('a');
    case 'number':
      return representativeValueContract.parse(0);
    case 'boolean':
      return representativeValueContract.parse(false);
    case 'literal':
      return representativeValueContract.parse(type.value);
    case 'union': {
      const [first] = type.members;
      return first === undefined
        ? representativeValueContract.parse('a')
        : representativeValueTransformer({ type: first });
    }
    case 'unknown':
      return representativeValueContract.parse('a');
    default:
      return representativeValueContract.parse('a');
  }
};
