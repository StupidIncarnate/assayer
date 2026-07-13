/**
 * PURPOSE: Contract for a representative arrange value — a single JSON-serializable input
 *   (string, number, or boolean) chosen from an operand's value range to drive a test case
 *   down a particular path. Sourced from the input domain, never from executing the code (P4).
 *
 * USAGE:
 * representativeValueContract.parse('');
 * // Returns a validated RepresentativeValue (branded)
 */
import { z } from 'zod';

export const representativeValueContract = z
  .union([z.string(), z.number(), z.boolean()])
  .brand<'RepresentativeValue'>();

export type RepresentativeValue = z.infer<typeof representativeValueContract>;
