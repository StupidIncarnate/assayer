/**
 * PURPOSE: Contract for a whitespace-normalized source fragment — a condition, discriminant, or case
 *   expression with insignificant whitespace collapsed to single spaces. Coverage IDs are minted from
 *   this form so a reformatted (reindented / rewrapped) construct keeps the same cache-internal
 *   identity and does not read as a changed node in the ref-to-ref diff.
 *
 * USAGE:
 * normalizedSourceContract.parse('name.length === 0');
 * // Returns a validated NormalizedSource (branded string)
 */
import { z } from 'zod';

export const normalizedSourceContract = z.string().min(1).brand<'NormalizedSource'>();

export type NormalizedSource = z.infer<typeof normalizedSourceContract>;
