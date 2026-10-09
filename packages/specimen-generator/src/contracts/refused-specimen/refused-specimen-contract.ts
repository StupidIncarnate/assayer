/**
 * PURPOSE: A specimen the generator planned and then dropped because TypeScript rejected its
 * code. Reach for this over generatedFileContract when the combination is not a valid program.
 *
 * USAGE:
 * refusedSpecimenContract.parse({ folder: 'if-number-class-body-cond-param', reason: "Type 'string' is not assignable to type 'number'." });
 * // Returns a RefusedSpecimen
 */
import { z } from '#gateway/npm/zod';

export const refusedSpecimenContract = z
  .object({
    folder: z.string().min(1).brand<'RefusedSpecimenFolder'>(),
    reason: z.string().min(1).brand<'RefusedSpecimenReason'>(),
  })
  .brand<'RefusedSpecimen'>();

export type RefusedSpecimen = z.infer<typeof refusedSpecimenContract>;
