/**
 * PURPOSE: Builds ONE runnable value of a declared type — the recursive core the fill seam is made of.
 *   An ARRAY becomes a real array of the `one` cardinality (`number[][]` → `[[7]]`), a TUPLE becomes a
 *   real array with one element per fixed position (`readonly [string, number]` → `['abc123', 7]`), an
 *   OBJECT becomes a real map of every property it declares (`{ db: { host: string } }` →
 *   `{ db: { host: 'abc123' } }`, the property-less shape → `{}`), a UNION becomes a value of its first
 *   fillable member, a TEMPLATE LITERAL becomes an interpolated string (handled by
 *   `representative-value-transformer`, which every other scalar already falls through to), and anything
 *   else scalar becomes its representative point. Every value is an INPUT drawn from the declared type,
 *   never a code-derived output (P4).
 *
 *   `undefined` means the type is UNFILLABLE — `is-type-fillable` is the rule, and this is the only
 *   thing that answers it with a value. It is returned rather than substituted so a callable, an opaque
 *   `Map<string, number>`, or the TRUNCATED re-entry of a self-referential type propagates its refusal
 *   out through every enclosing array and object instead of hiding a placeholder inside one.
 *
 *   Property order is the reader's, which sorts by name, so the built map is byte-identical run to run.
 *
 * USAGE:
 * fillValueTransformer({ type: { kind: 'array', element: { kind: 'number' } } });  // [7]
 * fillValueTransformer({ type: { kind: 'object', properties: [{ name: 'host', type: { kind: 'string' } }] } });
 * // { host: 'abc123' }
 */
import type { ArrangeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const fillValueTransformer = ({ type }: { type: TypeDescriptor }): ArrangeValue | undefined => {
  // An array VALUE is the `one` cardinality — the ordinary non-empty array. The empty/one/many fan-out
  // is an input-BREADTH axis a case set spans (`array-arrange` + `cause-arrange`), not what one value is.
  if (type.kind === 'array') {
    // Except where the element is TRUNCATED, which is the reader stopping on a self-reference. The EMPTY
    // cardinality is what terminates one: `[]` is a complete value of `TreeNode[]` without knowing the
    // element's shape, so `{ label: 'abc123', children: [] }` is a complete `TreeNode`. An element
    // refused for any other reason keeps the refusal — a filled array holds an element, and the empty
    // array is not offered as a way around a type nothing can be built for.
    if (type.element.kind === 'object' && type.element.truncated === true) {
      return [];
    }

    const element = fillValueTransformer({ type: type.element });

    return element === undefined
      ? undefined
      : Array.from({ length: arrayCardinalityStatics.counts.one }, () => element);
  }

  // Fixed-length and HETEROGENEOUS, unlike `array` above: one element PER POSITION, filled from that
  // position's own type rather than one shared element type repeated. One unfillable position refuses
  // the whole tuple — the same short-circuit an unfillable required object property applies below —
  // caught by the length check against the declared position count.
  if (type.kind === 'tuple') {
    const elements = type.elements.flatMap((element) => {
      const value = fillValueTransformer({ type: element });

      return value === undefined ? [] : [value];
    });

    return elements.length === type.elements.length ? elements : undefined;
  }

  if (type.kind === 'object') {
    // A TRUNCATED shape declares nothing about itself — its property list is where the reader stopped
    // on a self-reference — so `{}` is a wrong value, not an empty one. `is-type-fillable` says the same.
    if (type.truncated === true) {
      return undefined;
    }

    // Only the REQUIRED properties are owed a value: `{ label: 'abc123' }` is a complete
    // `interface TreeNode { label: string; child?: TreeNode }`, the same rule `is-type-fillable` states
    // and the object twin of an optional parameter nobody has to pass.
    const owed = type.properties.filter((property) => property.optional !== true);
    const entries = owed.flatMap((property) => {
      const value = fillValueTransformer({ type: property.type });

      return value === undefined ? [] : [[property.name, value] as const];
    });

    // One unfillable required property refuses the whole object, which is what `is-type-fillable`
    // already says; the count comparison is how that propagates without a placeholder standing in for
    // the missing one.
    return entries.length === owed.length ? Object.fromEntries(entries) : undefined;
  }

  // The first member the RULE admits, so a union whose first member is a callable still fills from the
  // member that can be built. Asking the guard keeps "which members count" stated in exactly one place.
  if (type.kind === 'union') {
    const member = type.members.find((candidate) => isTypeFillableGuard({ type: candidate }));

    return member === undefined ? undefined : fillValueTransformer({ type: member });
  }

  return representativeValueTransformer({ type });
};
