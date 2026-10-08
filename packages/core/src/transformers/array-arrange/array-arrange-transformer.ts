/**
 * PURPOSE: Arranges ONE array parameter into the value a case passes for it, at a requested element
 *   COUNT — the array twin of `object-arrange`. Building `count` elements is how an array param fans
 *   out over its cardinality (empty/one/many): the caller asks for each size and gets a real array, so
 *   code that operates on the array (`items.pop()`) runs on `[]`, `[7]`, and `[7,7]` rather than a
 *   scalar placeholder that would throw.
 *
 *   Each element is built by `fill-value`, so an element of ANY shape nests properly — a nested array
 *   (`number[][]` → `[[7]]`) and an object element (`Config[]` → `[{ mode: 'abc123' }]`) alike. Every
 *   element is an INPUT drawn from the element type, never a code-derived output (P4).
 *
 *   `undefined` means the ELEMENT type is unfillable, so no array of it can be built — a callback list
 *   is refused at every count, including the empty one, because the caller is asking for this parameter
 *   and the answer about the parameter is the same either way.
 *
 *   A TRUNCATED element is the one exception, and the empty array is its answer at EVERY count: the
 *   reader stopped at a self-reference, so `TreeNode[]` has no element to build but `[]` is a complete
 *   value of it. `is-type-fillable` and `fill-value` read the mark the same way, so the rule and the
 *   builder agree about `TreeNode[]` in a param position and in a property position alike.
 *
 * USAGE:
 * arrayArrangeTransformer({ element: { kind: 'number' }, count: 2 });        // [7, 7]
 * arrayArrangeTransformer({ element: { kind: 'array', element: { kind: 'number' } }, count: 1 }); // [[7]]
 * // Returns an ArrangeValue[] of the requested length, or undefined when the element cannot be built
 */
import type { ArrangeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { fillValueTransformer } from '../fill-value/fill-value-transformer';

export const arrayArrangeTransformer = ({
  element,
  count,
}: {
  element: TypeDescriptor;
  count: number;
}): ArrangeValue[] | undefined =>
  element.kind === 'object' && element.truncated === true
    ? []
    : isTypeFillableGuard({ type: element })
      ? Array.from({ length: count }, (_, index) => fillValueTransformer({ type: element, offset: index })).flatMap(
          (value) => (value === undefined ? [] : [value]),
        )
      : undefined;
