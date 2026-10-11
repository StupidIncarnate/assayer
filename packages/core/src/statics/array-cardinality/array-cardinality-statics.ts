/**
 * PURPOSE: The array cardinalities the arrange fan-out enumerates and the element COUNT each fills, so
 *   every array parameter derives one case per size class. The ORDER is load-bearing: `derive-cases`
 *   keeps the EARLIEST case of a route in the fewest-runs set, so `empty` leads and the empty `[]` is
 *   the one that runs for a branchless array (all cardinalities take the same arms) while `one`
 *   and `many` follow in the every-route set only. `max` is reserved for a future `.length`-guard rung and
 *   is deliberately absent from the fan-out order.
 *
 * USAGE:
 * arrayCardinalityStatics.order;       // ['empty', 'one', 'many']
 * arrayCardinalityStatics.counts.many; // 2
 */
export const arrayCardinalityStatics = {
  order: ['empty', 'one', 'many'],
  counts: { empty: 0, one: 1, many: 2 },
} as const;
