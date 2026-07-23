/**
 * PURPOSE: The array cardinalities the arrange fan-out enumerates and the element COUNT each fills, so
 *   every array parameter derives one case per size class. The ORDER is load-bearing: `derive-cases`
 *   marks the FIRST case per predicted output salient, so `one` leads and the ordinary non-empty `[7]`
 *   is the must-run representative while `empty` and `many` follow as the grayed breadth. `max` is
 *   reserved for a future `.length`-guard rung and is deliberately absent from the fan-out order.
 *
 * USAGE:
 * arrayCardinalityStatics.order;       // ['one', 'empty', 'many']
 * arrayCardinalityStatics.counts.many; // 2
 */
export const arrayCardinalityStatics = {
  order: ['one', 'empty', 'many'],
  counts: { empty: 0, one: 1, many: 2 },
} as const;
