/**
 * PURPOSE: Picks a single deterministic SCALAR point from a type's value domain — the point a case
 *   passes for a scalar parameter and the point the domain engine samples when a predicate names no
 *   literal. Deterministic (never random) so generated cases are golden-stable, and sourced from the
 *   type, never from executing the code (P4).
 *
 *   It answers ONLY for a type that genuinely has a scalar point: `string`, `number`, `boolean`, a
 *   literal, a union through the first member that has one, and a TEMPLATE LITERAL type through the
 *   scalar point of each of its own substitutions. Every other type — an array, a tuple, an object, a
 *   callable, an opaque unknown, an empty union — returns `undefined`, because there is no string that
 *   is an array and no number that is a callback. Substituting one is the defect this refusal exists to
 *   make impossible: a `Map` filled with a string reads `payload.size` as 6 and the case passes against
 *   an input the code was never given. Composite values (an array, a tuple) are `fill-value`'s job;
 *   refusing a parameter outright is `fill-param`'s.
 *
 *   A template literal type's scalar point is built by INTERPOLATING each substitution's own point
 *   between the type's literal segments, so `` `id-${string}` `` reads its `string` substitution's point
 *   and produces `'id-abc123'` — a value drawn from the declared shape, never a stand-in. A SINGLE
 *   substitution refusing (an object, a callable — TypeScript itself never actually declares one, but
 *   the check stays honest either way) refuses the whole template, the same short-circuit `fill-value`
 *   applies to one unfillable array element.
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
  offset = 0,
}: {
  type: TypeDescriptor;
  offset?: number;
}): RepresentativeValue | undefined => {
  switch (type.kind) {
    case 'string':
      return representativeValueContract.parse(
        offset === 0
          ? representativeValueStatics.string
          : `${representativeValueStatics.string}_${String(offset)}`,
      );
    case 'number':
      return representativeValueContract.parse(representativeValueStatics.number + offset);
    case 'boolean':
      return representativeValueContract.parse(
        offset === 0 ? representativeValueStatics.boolean : !representativeValueStatics.boolean,
      );
    case 'literal':
      return representativeValueContract.parse(type.value);
    // The first member that HAS a scalar point, so `Config | string` samples the string rather than
    // refusing on the object it met first. A union of composites has none and refuses.
    case 'union': {
      const [first] = type.members.flatMap((member) => {
        const value = representativeValueTransformer({ type: member, offset });

        return value === undefined ? [] : [value];
      });

      return first;
    }
    // Interpolates each substitution's own scalar point between the type's literal segments. One
    // substitution refusing (returning `undefined`) refuses the whole template — there is no way to
    // interpolate a hole into a string — mirrored by `flatMap` dropping short if any point is missing,
    // caught by the length check against the substitution count.
    case 'template': {
      const points = type.types.flatMap((substitution) => {
        const point = representativeValueTransformer({ type: substitution });

        return point === undefined ? [] : [point];
      });

      if (points.length !== type.types.length) {
        return undefined;
      }

      const joined = type.texts.reduce(
        (accumulated, text, index) => `${accumulated}${text}${index < points.length ? String(points[index]) : ''}`,
        '',
      );

      return representativeValueContract.parse(joined);
    }
    // None of these has a member of the scalar domain (string/number/boolean/null), so refuse rather
    // than stand something in. All are NAMED so a kind added later fails the exhaustiveness check
    // and forces a decision; the default shares their answer because refusing is the safe one.
    case 'array':
    case 'tuple':
    case 'object':
    case 'callable':
    case 'unknown':
    default:
      return undefined;
  }
};
