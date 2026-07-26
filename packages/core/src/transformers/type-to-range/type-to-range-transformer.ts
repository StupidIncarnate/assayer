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
 *   Equality splits on whether the operand's type ENUMERATES its values. Against a union OR a boolean,
 *   the values other than the literal are known — a boolean has exactly one other value, its logical
 *   complement — so `!== 'a'` and `b !== false` are both the closed set of the rest and realize a real
 *   member (tier-2). Against an open type they are not, so it is the whole domain minus a point — an
 *   exclusion. Collapsing that second case to a single sample is what makes a later comparison on the
 *   same operand intersect to nothing, which is also why a boolean cannot stay open: the seam's own
 *   fallback fill for an unconstrained boolean is its OTHER value (`representative-value-statics`), so
 *   an exclusion realizing to nothing would land the excluded arm on the exact literal it excludes.
 *
 *   A type with no SCALAR point at all — an object, an array, a callable, an opaque `Map<string,
 *   number>` — narrows only where the predicate itself carries the literal (`config.mode === 'a'` still
 *   yields `{'a'}` vs everything else). Where an arm would otherwise be realized from the operand's own
 *   representative, it constrains NOTHING instead of substituting a string for a shape that is not one,
 *   and the fill seam then builds the real shape. That leaves one thing this engine cannot state: the
 *   arm demanding a FALSY value of such a type has no member to name, and "no value of this type is
 *   falsy" is a fillability fact rather than a domain, so it is answered on the fill side
 *   (`is-falsy-arm`, which `object-arrange` refuses on) and never by narrowing to empty here — an empty
 *   domain would mean the guards CONTRADICT, and nothing about that arm is dead.
 *
 *   `typeof-eq`/`typeof-neq` narrow by the operand's RUNTIME TAG rather than its value, via
 *   `typeofDomainTransformer`: each candidate member of the type — or the type itself, treated as a
 *   one-member union, when it is not one — is classified onto the tag `typeof` would give it
 *   (`typeofTagTransformer`), and split into the side that matches the compared-against tag versus the
 *   side that does not. A member that matches but has no scalar point (an object, an array) still keeps
 *   that arm real; this engine just cannot name a point inside it, so it constrains NOTHING there and the
 *   fill seam builds the shape, mirroring the no-scalar-point rule two paragraphs up. Only a side with NO
 *   matching member at all, where some other member's tag is known, becomes the genuine empty domain
 *   that marks an arm impossible — which is how a bare, non-union `target: string` still gets a real
 *   `{members: []}` on its `typeof target !== 'string'` arm: every value matches the other side, so this
 *   one truly cannot be reached.
 *
 * USAGE:
 * typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-gte', literal: 2 });
 * // Returns { satisfying: {lengthMin: 2}, violating: {lengthMax: 2, lengthMaxExclusive: true} }
 * typeToRangeTransformer({ type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }, predicateKind: 'typeof-eq', literal: 'string' });
 * // Returns { satisfying: {members: ['abc123']}, violating: {members: [7]} }
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { armValuesContract } from '../../contracts/arm-values/arm-values-contract';
import type { ArmValues } from '../../contracts/arm-values/arm-values-contract';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeofDomainTransformer } from '../typeof-domain/typeof-domain-transformer';
import type { TypeofTag } from '../typeof-tag/typeof-tag-transformer';

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
  const unionOthers: RepresentativeValue[] =
    type.kind === 'union'
      ? type.members.flatMap((member) => (member.kind === 'literal' && member.value !== literal ? [member.value] : []))
      : type.kind === 'boolean' && typeof literal === 'boolean'
        ? [representativeValueContract.parse(!literal)]
        : [];
  const excludedPoint = literal === undefined ? rep : literal;
  // An enumerated type knows the other members by name; a BOOLEAN is a closed two-value enumeration of
  // its own (`unionOthers` names the complement above); an open type only knows the point to avoid, and
  // a type with no scalar point knows neither — so it excludes nothing rather than excluding a fiction.
  const otherThanLiteral =
    unionOthers.length > 0
      ? { members: unionOthers }
      : excludedPoint === undefined
        ? {}
        : { excluded: [excludedPoint] };
  const literalPoint = literal === undefined ? rep : literal;
  const isLiteral = literalPoint === undefined ? {} : { members: [literalPoint] };
  // Every arm that would be realized from the operand's OWN representative, for a type that has none.
  // Constraining nothing is the same safety property the unrecognized predicate relies on.
  const unrealizable = armValuesContract.parse({ satisfying: {}, violating: {} });

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
      return type.kind === 'number'
        ? armValuesContract.parse({ satisfying: { excluded: [0] }, violating: { members: [0] } })
        : type.kind === 'boolean'
          ? armValuesContract.parse({ satisfying: { members: [true] }, violating: { members: [false] } })
          : rep === undefined
            ? unrealizable
            : armValuesContract.parse({ satisfying: { members: [rep] }, violating: { members: [''] } });
    case 'falsy':
      return type.kind === 'number'
        ? armValuesContract.parse({ satisfying: { members: [0] }, violating: { excluded: [0] } })
        : type.kind === 'boolean'
          ? armValuesContract.parse({ satisfying: { members: [false] }, violating: { members: [true] } })
          : rep === undefined
            ? unrealizable
            : armValuesContract.parse({ satisfying: { members: [''] }, violating: { members: [rep] } });
    // The `??` operand: satisfying is a NON-null value drawn from the type (`rep`, which the
    // representative transformer never returns null for), violating is `null` — ALWAYS, regardless of
    // whether the type has a scalar point. `null` is nullish independent of what the operand's non-null
    // half is, so an object/array/callable/unknown operand (`rep === undefined`) still violates on
    // exactly `null`: only the SATISFYING side has nothing to name (the fill seam builds the real
    // non-null shape, `type-to-range` cannot), never the violating one. Narrowing the violating side to
    // `{}` here would be the G1 mistake one arm over — the same `??`-discards-a-legitimate-`null` shape
    // `plan/open-defects.md` names, just moved from a scalar operand to a composite one.
    case 'non-nullish':
      return armValuesContract.parse({
        satisfying: rep === undefined ? {} : { members: [rep] },
        violating: { members: [null] },
      });
    // The runtime-tag axis: `literal` here is always the STRING tag `typeof` compared against
    // (`predicateTransformer` never emits this kind otherwise), never a value of the operand's own
    // type. `typeof-eq`'s satisfying side is the tag-matching side and its violating side is
    // everything else; `typeof-neq` is the exact mirror.
    case 'typeof-eq':
    case 'typeof-neq': {
      const tag = typeof literal === 'string' ? (literal as TypeofTag) : undefined;

      if (tag === undefined) {
        return armValuesContract.parse({ satisfying: {}, violating: {} });
      }

      const matching = typeofDomainTransformer({ type, tag, wantMatch: true });
      const rest = typeofDomainTransformer({ type, tag, wantMatch: false });

      return armValuesContract.parse(
        predicateKind === 'typeof-eq' ? { satisfying: matching, violating: rest } : { satisfying: rest, violating: matching },
      );
    }
    default:
      // Unrecognized: constrain NOTHING on either arm. A predicate the analyzer could not read must
      // not narrow anything, or an unread guard would be able to prove a reachable exit impossible.
      return armValuesContract.parse({ satisfying: {}, violating: {} });
  }
};
