/**
 * PURPOSE: Contract for a representative arrange value — a single JSON-serializable input
 *   (string, number, boolean, or null) chosen from an operand's value range to drive a test case
 *   down a particular path. Sourced from the input domain, never from executing the code (P4).
 *
 *   `null` is a value in the domain because a nullish operand HAS one: `a ?? b` reaches its
 *   fall-through only when `a` is null/undefined, so the else arm arranges the operand to `null` —
 *   a value drawn from the declared type (`string | null`), not from running the code.
 *
 * USAGE:
 * representativeValueContract.parse('');
 * // Returns a validated RepresentativeValue (branded)
 */
import { z } from 'zod';

// `null` is unioned OUTSIDE the brand on purpose: `.brand()` intersects a phantom property onto its
// output, and `null & { brand }` collapses to `never`, so branding a union that includes null would
// silently drop the null arm from the type. Branding the primitives and unioning null keeps null a
// first-class member of the output type.
export const representativeValueContract = z
  .union([z.string(), z.number(), z.boolean()])
  .brand<'RepresentativeValue'>()
  .or(z.null());

export type RepresentativeValue = z.infer<typeof representativeValueContract>;
