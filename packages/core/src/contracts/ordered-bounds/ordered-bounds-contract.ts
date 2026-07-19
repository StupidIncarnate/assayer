/**
 * PURPOSE: Contract for one pair of ordered bounds — a lower and an upper limit, each optional and each
 *   independently inclusive or exclusive. The arithmetic shape a value domain's axes are intersected
 *   in, kept apart from the domain itself because a domain has TWO of them.
 *
 *   Absent means UNBOUNDED that way, never zero. A domain saying nothing about its upper limit is open
 *   above, and reading an absent bound as a limit would make every unstated side an impossible one.
 *
 * USAGE:
 * orderedBoundsContract.parse({ min: 10, minExclusive: true });
 * // Returns { min: 10, minExclusive: true, maxExclusive: false } — 10 < x
 */
import { z } from 'zod';

export const orderedBoundsContract = z.object({
  min: z.number().brand<'OrderedBound'>().optional(),
  minExclusive: z.boolean().default(false),
  max: z.number().brand<'OrderedBound'>().optional(),
  maxExclusive: z.boolean().default(false),
});

export type OrderedBounds = z.infer<typeof orderedBoundsContract>;
