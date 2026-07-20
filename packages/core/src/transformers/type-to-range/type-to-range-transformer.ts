/**
 * PURPOSE: Derives the satisfying vs violating value DOMAINS for a branch predicate on a typed
 *   operand — the "data range" per arm. Sourced from the operand's type + the predicate, never from
 *   executing the code (P4). Deterministic, and extended by adding one switch case.
 *
 *   It yields domains rather than sample values so that several guards on one operand can be
 *   INTERSECTED before a value is chosen (`value-domain` carries the reasoning). A comparison becomes
 *   a bound, an equality becomes a member or an exclusion, and an unrecognized predicate becomes a
 *   domain that constrains nothing — the last of those is a safety property, not a convenience: an
 *   unread predicate must never be able to make a reachable path look impossible.
 *
 *   A `.length` comparison lands on the domain's LENGTH axis, never its value axis. `s.length >= 3`
 *   says nothing about where `s` sits in an ordering of strings, so `min: 3` would assert a bound the
 *   source never wrote; realizing it as `members: ['aaa']` would sample it, and the next length guard
 *   would then intersect against one string rather than against a bound — which is precisely how a
 *   satisfiable pair of guards used to come out empty.
 *
 *   Equality splits on whether the operand's type ENUMERATES its values. Against a union, the values
 *   other than the literal are known, so `!== 'a'` is the closed set of the rest and fans out one case
 *   per member (tier-2). Against an open type they are not, so it is the whole domain minus a point —
 *   an exclusion. Collapsing that second case to a single sample is what makes a later comparison on
 *   the same operand intersect to nothing.
 *
 * USAGE:
 * typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-gte', literal: 2 });
 * // Returns { satisfying: {lengthMin: 2}, violating: {lengthMax: 2, lengthMaxExclusive: true} }
 */
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { armValuesContract } from '../../contracts/arm-values/arm-values-contract';
import type { ArmValues } from '../../contracts/arm-values/arm-values-contract';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const typeToRangeTransformer = ({
  type,
  predicateKind,
  literal,
}: {
  type: TypeDescriptor;
  predicateKind: string;
  literal?: string | number | boolean | null;
}): ArmValues => {
  const rep = representativeValueTransformer({ type });
  const num = typeof literal === 'number' ? literal : 0;
  const distinct =
    literal === undefined
      ? rep
      : typeof literal === 'number'
        ? literal + 1
        : typeof literal === 'boolean'
          ? !literal
          : `${literal}x`;
  const unionOthers: RepresentativeValue[] =
    type.kind === 'union'
      ? type.members.flatMap((member) => (member.kind === 'literal' && member.value !== literal ? [member.value] : []))
      : [];
  // An enumerated type knows the other members by name; an open one only knows the point to avoid.
  const otherThanLiteral =
    unionOthers.length > 0 ? { members: unionOthers } : { excluded: [literal === undefined ? distinct : literal] };
  const isLiteral = { members: [literal ?? rep] };

  switch (predicateKind) {
    // The length axis, mirroring the value axis one line for one line. A length comparison becomes a
    // length BOUND for the same reason a numeric one becomes a value bound: a bound intersects with
    // the next guard, and a realized string does not. `length === 0` is not special here — it is
    // `length-eq` carrying 0, and it still realizes '' against '' the moment a value is picked.
    case 'length-eq':
      return armValuesContract.parse({
        satisfying: { lengthMin: num, lengthMax: num },
        violating: { lengthExcluded: [num] },
      });
    case 'length-neq':
      return armValuesContract.parse({
        satisfying: { lengthExcluded: [num] },
        violating: { lengthMin: num, lengthMax: num },
      });
    case 'length-gt':
      return armValuesContract.parse({
        satisfying: { lengthMin: num, lengthMinExclusive: true },
        violating: { lengthMax: num },
      });
    case 'length-gte':
      return armValuesContract.parse({
        satisfying: { lengthMin: num },
        violating: { lengthMax: num, lengthMaxExclusive: true },
      });
    case 'length-lt':
      return armValuesContract.parse({
        satisfying: { lengthMax: num, lengthMaxExclusive: true },
        violating: { lengthMin: num },
      });
    case 'length-lte':
      return armValuesContract.parse({
        satisfying: { lengthMax: num },
        violating: { lengthMin: num, lengthMinExclusive: true },
      });
    case 'eq':
      return armValuesContract.parse({ satisfying: isLiteral, violating: otherThanLiteral });
    case 'neq':
      return armValuesContract.parse({ satisfying: otherThanLiteral, violating: isLiteral });
    case 'gt':
      return armValuesContract.parse({
        satisfying: { min: num, minExclusive: true },
        violating: { max: num },
      });
    case 'gte':
      return armValuesContract.parse({
        satisfying: { min: num },
        violating: { max: num, maxExclusive: true },
      });
    case 'lt':
      return armValuesContract.parse({
        satisfying: { max: num, maxExclusive: true },
        violating: { min: num },
      });
    case 'lte':
      return armValuesContract.parse({
        satisfying: { max: num },
        violating: { min: num, minExclusive: true },
      });
    case 'truthy':
      return armValuesContract.parse(
        type.kind === 'number'
          ? { satisfying: { excluded: [0] }, violating: { members: [0] } }
          : type.kind === 'boolean'
            ? { satisfying: { members: [true] }, violating: { members: [false] } }
            : { satisfying: { members: [rep] }, violating: { members: [''] } },
      );
    case 'falsy':
      return armValuesContract.parse(
        type.kind === 'number'
          ? { satisfying: { members: [0] }, violating: { excluded: [0] } }
          : type.kind === 'boolean'
            ? { satisfying: { members: [false] }, violating: { members: [true] } }
            : { satisfying: { members: [''] }, violating: { members: [rep] } },
      );
    // The `??` operand: satisfying is a NON-null value drawn from the type (`rep`, which the
    // representative transformer never returns null for), violating is `null`. `null` is nullish, so
    // it reaches the fall-through arm at runtime whatever the operand's non-null half is. The value is
    // derived from the declared type, never from executing the code (P4).
    case 'non-nullish':
      return armValuesContract.parse({
        satisfying: { members: [rep] },
        violating: { members: [null] },
      });
    default:
      // Unrecognized: constrain NOTHING on either arm. A predicate the analyzer could not read must
      // not narrow anything, or an unread guard would be able to prove a reachable exit impossible.
      return armValuesContract.parse({ satisfying: {}, violating: {} });
  }
};
