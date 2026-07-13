/**
 * PURPOSE: Contract for a type's display text — the raw TypeScript type string (e.g. 'void',
 *   'Date') carried by an opaque/unknown type descriptor so the enrichment panel can render the
 *   type even when Assayer cannot model its value domain.
 *
 * USAGE:
 * typeTextContract.parse('void');
 * // Returns a validated TypeText (branded)
 */
import { z } from 'zod';

export const typeTextContract = z.string().min(1).brand<'TypeText'>();

export type TypeText = z.infer<typeof typeTextContract>;
