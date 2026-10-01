/**
 * PURPOSE: What a branch operand is WELDED to when it names a same-file `const`: the literal VALUE of
 *   a scalar constant, or the LENGTH of an array-literal constant. `readConstOperandLayerTransformer`
 *   returns this, and the condition-tree reader stamps it onto the leaf as `operandConstValue` or
 *   `operandConstLength`. Reach for it only for the welded constant; an operand's declared type is a
 *   `TypeDescriptor`, not this.
 *
 * USAGE:
 * constOperandReadoutContract.parse({ length: 3 });
 * // Returns a validated ConstOperandReadout for `const items = [1, 2, 3]`
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract } from '@assayer/shared/contracts';

export const constOperandReadoutContract = z
  .object({
    value: representativeValueContract.optional(),
    length: z.number().brand<'ConstOperandReadoutLength'>().optional(),
  })
  .brand<'ConstOperandReadout'>();

export type ConstOperandReadout = z.infer<typeof constOperandReadoutContract>;
