/**
 * PURPOSE: Arranges ONE array parameter into the value a case passes for it, at a requested element
 *   COUNT — the array twin of `object-arrange`. Building `count` elements is how an array param fans
 *   out over its cardinality (empty/one/many): the caller asks for each size and gets a real array, so
 *   code that operates on the array (`items.pop()`) runs on `[]`, `[7]`, and `[7,7]` rather than a
 *   scalar placeholder that would throw.
 *
 *   RECURSIVE: a nested array element (`number[][]`) is filled by arranging its OWN element at the
 *   `one` cardinality (`[[7]]`), a genuine nested array rather than a scalar placeholder. Scalar
 *   elements come from `representative-value`. Every element is an INPUT drawn from the element type,
 *   never a code-derived output (P4).
 *
 * USAGE:
 * arrayArrangeTransformer({ element: { kind: 'number' }, count: 2 });        // [7, 7]
 * arrayArrangeTransformer({ element: { kind: 'array', element: { kind: 'number' } }, count: 1 }); // [[7]]
 * // Returns an ArrangeValue[] of the requested length
 */
import type { ArrangeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const arrayArrangeTransformer = ({
  element,
  count,
}: {
  element: TypeDescriptor;
  count: number;
}): ArrangeValue[] =>
  Array.from({ length: count }, (): ArrangeValue =>
    element.kind === 'array'
      ? arrayArrangeTransformer({ element: element.element, count: arrayCardinalityStatics.counts.one })
      : representativeValueTransformer({ type: element }),
  );
