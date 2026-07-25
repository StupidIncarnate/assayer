/**
 * PURPOSE: Picks a single deterministic SCALAR point from a type's value domain — the point a case
 *   passes for a scalar parameter and the point the domain engine samples when a predicate names no
 *   literal. Deterministic (never random) so generated cases are golden-stable, and sourced from the
 *   type, never from executing the code (P4).
 *
 *   It answers ONLY for a type that genuinely has a scalar point: `string`, `number`, `boolean`, a
 *   literal, and a union through the first member that has one. Every other type — an array, an object,
 *   a callable, an opaque unknown, an empty union — returns `undefined`, because there is no string that
 *   is an array and no number that is a callback. Substituting one is the defect this refusal exists to
 *   make impossible: a `Map` filled with a string reads `payload.size` as 6 and the case passes against
 *   an input the code was never given. Composite values are `fill-value`'s job; refusing a parameter
 *   outright is `fill-param`'s.
 *
 * USAGE:
 * representativeValueTransformer({ type: { kind: 'string' } });
 * // Returns 'abc123' (branded RepresentativeValue)
 * representativeValueTransformer({ type: { kind: 'callable', text: '() => void' } });
 * // Returns undefined — no scalar is a function
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { representativeValueStatics } from '../../statics/representative-value/representative-value-statics';

export const representativeValueTransformer = ({
  type,
}: {
  type: TypeDescriptor;
}): RepresentativeValue | undefined => {
  switch (type.kind) {
    case 'string':
      return representativeValueContract.parse(representativeValueStatics.string);
    case 'number':
      return representativeValueContract.parse(representativeValueStatics.number);
    case 'boolean':
      return representativeValueContract.parse(representativeValueStatics.boolean);
    case 'literal':
      return representativeValueContract.parse(type.value);
    // The first member that HAS a scalar point, so `Config | string` samples the string rather than
    // refusing on the object it met first. A union of composites has none and refuses.
    case 'union': {
      const [first] = type.members.flatMap((member) => {
        const value = representativeValueTransformer({ type: member });

        return value === undefined ? [] : [value];
      });

      return first;
    }
    // None of these has a member of the scalar domain (string/number/boolean/null), so refuse rather
    // than stand something in. All four are NAMED so a kind added later fails the exhaustiveness check
    // and forces a decision; the default shares their answer because refusing is the safe one.
    case 'array':
    case 'object':
    case 'callable':
    case 'unknown':
    default:
      return undefined;
  }
};
