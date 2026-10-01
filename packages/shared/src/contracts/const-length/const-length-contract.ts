/**
 * PURPOSE: Contract for the fixed LENGTH a branch operand is welded to — the element count of a
 *   same-file `const xs = [ … ]` array literal that a `.length` comparison is decided against. A
 *   non-negative integer, because a length is a count by the language's own definition.
 *
 * USAGE:
 * const length = constLengthContract.parse(3);
 * // Returns a validated ConstLength (branded)
 */
import { z } from '#gateway/npm/zod';

export const constLengthContract = z.number().int().nonnegative().brand<'ConstLength'>();

export type ConstLength = z.infer<typeof constLengthContract>;
