/**
 * PURPOSE: Intersects two value domains into the one domain a value must satisfy to meet both — the
 *   step that lets an exit behind several guards be arranged correctly, and the step that makes an
 *   impossible exit provable.
 *
 *   Each axis narrows on its own terms: bounds take the TIGHTER side (both the value's own and its
 *   length's, through the same `intersect-bounds` rule so the two cannot disagree), enumerations
 *   intersect (and an absent enumeration means "open", so it yields to whichever side has one), and
 *   exclusions accumulate — a value must avoid every point either side ruled out, on either axis.
 *
 *   Nothing here decides emptiness; `is-domain-empty` reads that off the result. Keeping the two apart
 *   matters because intersection is associative and must stay so — folding a whole guard path is one
 *   `reduce`, and a step that collapsed to a verdict could not be folded further.
 *
 * USAGE:
 * intersectDomainsTransformer({ left: { max: 100 }, right: { min: 10, minExclusive: true } });
 * // Returns { min: 10, minExclusive: true, max: 100, maxExclusive: false, excluded: [] } — 11…100
 */
import { orderedBoundsContract } from '../../contracts/ordered-bounds/ordered-bounds-contract';
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { intersectBoundsTransformer } from '../intersect-bounds/intersect-bounds-transformer';

export const intersectDomainsTransformer = ({
  left,
  right,
}: {
  left: ValueDomain;
  right: ValueDomain;
}): ValueDomain => {
  const value = intersectBoundsTransformer({
    left: orderedBoundsContract.parse({
      ...(left.min === undefined ? {} : { min: left.min }),
      minExclusive: left.minExclusive,
      ...(left.max === undefined ? {} : { max: left.max }),
      maxExclusive: left.maxExclusive,
    }),
    right: orderedBoundsContract.parse({
      ...(right.min === undefined ? {} : { min: right.min }),
      minExclusive: right.minExclusive,
      ...(right.max === undefined ? {} : { max: right.max }),
      maxExclusive: right.maxExclusive,
    }),
  });

  const length = intersectBoundsTransformer({
    left: orderedBoundsContract.parse({
      ...(left.lengthMin === undefined ? {} : { min: left.lengthMin }),
      minExclusive: left.lengthMinExclusive,
      ...(left.lengthMax === undefined ? {} : { max: left.lengthMax }),
      maxExclusive: left.lengthMaxExclusive,
    }),
    right: orderedBoundsContract.parse({
      ...(right.lengthMin === undefined ? {} : { min: right.lengthMin }),
      minExclusive: right.lengthMinExclusive,
      ...(right.lengthMax === undefined ? {} : { max: right.lengthMax }),
      maxExclusive: right.lengthMaxExclusive,
    }),
  });

  // An ABSENT enumeration is open, not empty, so it must not narrow the other side to nothing.
  const members =
    left.members === undefined
      ? right.members
      : right.members === undefined
        ? left.members
        : left.members.filter((member) => right.members?.includes(member) === true);

  return valueDomainContract.parse({
    ...(value.min === undefined ? {} : { min: value.min }),
    minExclusive: value.minExclusive,
    ...(value.max === undefined ? {} : { max: value.max }),
    maxExclusive: value.maxExclusive,
    ...(length.min === undefined ? {} : { lengthMin: length.min }),
    lengthMinExclusive: length.minExclusive,
    ...(length.max === undefined ? {} : { lengthMax: length.max }),
    lengthMaxExclusive: length.maxExclusive,
    lengthExcluded: [...new Set([...left.lengthExcluded, ...right.lengthExcluded])],
    ...(members === undefined ? {} : { members }),
    excluded: [...new Set([...left.excluded, ...right.excluded])],
  });
};
