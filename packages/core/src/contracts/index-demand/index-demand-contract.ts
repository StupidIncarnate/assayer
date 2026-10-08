/**
 * PURPOSE: Contract for an index demand — an array index operation (.at or []) on an input parameter
 *   or an array parameter whose length flows into an index. Derives test cases that test in-bounds
 *   and out-of-bounds boundary values.
 *
 * USAGE:
 * indexDemandContract.parse({ kind: 'param-index', param: 'index', operation: 'at' });
 * // Returns a validated IndexDemand
 */
import { z } from '#gateway/npm/zod';

export const indexDemandContract = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('param-index'),
      param: z.string().min(1).brand<'IndexDemandParam'>(),
      operation: z.enum(['at', 'bracket']),
    })
    .brand<'IndexDemand'>(),
  z
    .object({
      kind: z.literal('array-length-index'),
      arrayParam: z.string().min(1).brand<'IndexDemandArrayParam'>(),
      targetLength: z.number().int().positive().brand<'IndexDemandTargetLength'>(),
      operation: z.enum(['at', 'bracket']),
    })
    .brand<'IndexDemand'>(),
]);

export type IndexDemand = z.infer<typeof indexDemandContract>;
