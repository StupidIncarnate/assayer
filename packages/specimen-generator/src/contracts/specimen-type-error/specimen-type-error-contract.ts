/**
 * PURPOSE: What TypeScript said about one generated specimen source file: the file's path and each
 * distinct message. Reach for this over refusedSpecimenContract when the caller has only a file path
 * and still has to map it to a specimen folder.
 *
 * USAGE:
 * specimenTypeErrorContract.parse({ relPath: 'src/if/a/a.ts', messages: ["'x' is declared but its value is never read."] });
 * // Returns a SpecimenTypeError
 */
import { z } from '#gateway/npm/zod';

export const specimenTypeErrorContract = z
  .object({
    relPath: z.string().min(1).brand<'SpecimenTypeErrorRelPath'>(),
    messages: z.array(z.string().min(1).brand<'SpecimenTypeErrorMessages'>()).min(1).brand<'SpecimenTypeErrorMessages'>(),
  })
  .brand<'SpecimenTypeError'>();

export type SpecimenTypeError = z.infer<typeof specimenTypeErrorContract>;
