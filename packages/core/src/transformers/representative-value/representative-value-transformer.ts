/**
 * PURPOSE: Picks a single deterministic representative value for a type descriptor — used to fill
 *   parameters no branch constrains and as the fallback for unrecognized predicates. Deterministic
 *   (never random) so generated cases are golden-stable, and sourced from the type, never from
 *   executing the code (P4).
 *
 * USAGE:
 * representativeValueTransformer({ type: { kind: 'string' } });
 * // Returns 'abc123' (branded RepresentativeValue)
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { representativeValueStatics } from '../../statics/representative-value/representative-value-statics';

export const representativeValueTransformer = ({ type }: { type: TypeDescriptor }): RepresentativeValue => {
  switch (type.kind) {
    case 'string':
      return representativeValueContract.parse(representativeValueStatics.string);
    case 'number':
      return representativeValueContract.parse(representativeValueStatics.number);
    case 'boolean':
      return representativeValueContract.parse(representativeValueStatics.boolean);
    case 'literal':
      return representativeValueContract.parse(type.value);
    case 'union': {
      const [first] = type.members;
      return first === undefined
        ? representativeValueContract.parse(representativeValueStatics.string)
        : representativeValueTransformer({ type: first });
    }
    // An array or object has no single scalar value in the representable domain (string/number/
    // boolean/null), so it falls back to the string placeholder — the same honest default `unknown`
    // takes. Per-property object arrangement is `object-arrange`'s job, at consume time.
    case 'array':
      return representativeValueContract.parse(representativeValueStatics.string);
    case 'object':
      return representativeValueContract.parse(representativeValueStatics.string);
    case 'unknown':
      return representativeValueContract.parse(representativeValueStatics.string);
    default:
      return representativeValueContract.parse(representativeValueStatics.string);
  }
};
