/**
 * PURPOSE: Contract for one harness INPUT KEY — the (entry, parameter) pair a colocated harness
 *   declares a value for. The key alone is the cacheable half of a harness: it says WHICH refusal the
 *   file closes, and nothing about the value that closes it.
 *
 *   The value never rides here, and that is the point. A harness input is a callback, an instance, a
 *   thing with identity — none of which serializes, and any rendering of one would be a second encoding
 *   of a value the run already has. Keys alone also keep the derived index deterministic: the same
 *   declaration always produces the same bytes, whatever the values are.
 *
 * USAGE:
 * harnessInputKeyContract.parse({ entry: 'audit', param: 'report' });
 * // Returns a validated HarnessInputKey (branded fields)
 */
import { z } from '#gateway/npm/zod';


export const harnessInputKeyContract = z.object({
  entry: z.string().min(1).brand<'HarnessInputKeyEntry'>(),
  param: z.string().min(1).brand<'HarnessInputKeyParam'>(),
});

export type HarnessInputKey = z.infer<typeof harnessInputKeyContract>;
