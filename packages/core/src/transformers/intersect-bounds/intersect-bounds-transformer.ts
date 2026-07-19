/**
 * PURPOSE: Intersects one pair of ordered bounds — the tighter lower limit and the tighter upper limit
 *   a value must satisfy to meet both sides — with exclusivity carried through.
 *
 *   It exists because a value domain has TWO such axes (the value's own bounds and its length's), and
 *   the tie rule is subtle enough that a second copy would drift: on an EQUAL bound the exclusive side
 *   must win, since `> 5` and `>= 5` together still rule 5 out. Stating that once means the two axes
 *   cannot disagree about it.
 *
 *   Nothing here decides emptiness. Crossed bounds are a legitimate result and the caller reads the
 *   verdict off them, which is what keeps intersection associative — folding a whole guard path is one
 *   `reduce`, and a step that collapsed to a verdict could not be folded further.
 *
 * USAGE:
 * intersectBoundsTransformer({ left: { max: 100 }, right: { min: 10, minExclusive: true } });
 * // Returns { min: 10, minExclusive: true, max: 100, maxExclusive: false } — 10 < x <= 100
 */
import { orderedBoundsContract } from '../../contracts/ordered-bounds/ordered-bounds-contract';
import type { OrderedBounds } from '../../contracts/ordered-bounds/ordered-bounds-contract';

export const intersectBoundsTransformer = ({
  left,
  right,
}: {
  left: OrderedBounds;
  right: OrderedBounds;
}): OrderedBounds => {
  const minFromLeft = right.min === undefined || (left.min !== undefined && left.min >= right.min);
  const min = minFromLeft ? left.min : right.min;
  const minExclusive =
    left.min !== undefined && right.min !== undefined && left.min === right.min
      ? left.minExclusive || right.minExclusive
      : minFromLeft
        ? left.minExclusive
        : right.minExclusive;

  const maxFromLeft = right.max === undefined || (left.max !== undefined && left.max <= right.max);
  const max = maxFromLeft ? left.max : right.max;
  const maxExclusive =
    left.max !== undefined && right.max !== undefined && left.max === right.max
      ? left.maxExclusive || right.maxExclusive
      : maxFromLeft
        ? left.maxExclusive
        : right.maxExclusive;

  return orderedBoundsContract.parse({
    ...(min === undefined ? {} : { min }),
    minExclusive,
    ...(max === undefined ? {} : { max }),
    maxExclusive,
  });
};
