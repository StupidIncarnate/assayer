/**
 * PURPOSE: Contract for a derived case's arrange rendered as DISPLAY text — what a reader sees
 *   beside the case in the CLI report, in `assayer detail`, and in the desktop's tests panel.
 *
 *   Display only, and it must stay so: nothing derives, keys, or matches on this. A case's identity
 *   is its exit id and its arrange bindings, which are structured data — this is the sentence about
 *   them.
 *
 * USAGE:
 * arrangeTextContract.parse('LEVEL="6"');
 * // Returns a validated ArrangeText (branded)
 */
import { z } from 'zod';

export const arrangeTextContract = z.string().brand<'ArrangeText'>();

export type ArrangeText = z.infer<typeof arrangeTextContract>;
