/**
 * PURPOSE: Contract for a realizable LENGTH — a non-negative integer, which is what `.length` can
 *   actually be. Distinct from the length BOUNDS a domain carries, and deliberately so: a bound is
 *   whatever number the source compared against (`s.length > 1.5` is legal TypeScript), while a length
 *   a case can realize must be a count. Solving the bounds down to lengths is where that rounding
 *   happens, and this contract is what makes the result of it a different type from its input.
 *
 * USAGE:
 * stringLengthContract.parse(3);
 * // Returns a validated StringLength (branded)
 */
import { z } from 'zod';

export const stringLengthContract = z.number().int().nonnegative().brand<'StringLength'>();

export type StringLength = z.infer<typeof stringLengthContract>;
