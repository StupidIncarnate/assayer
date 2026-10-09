/**
 * PURPOSE: One file where the committed generated output and a fresh generation disagree. Reach for
 * this when reporting what the check step found. A file the generator wrote on purpose is a
 * generatedFileContract, and a combination TypeScript rejected is a refusedSpecimenContract.
 *
 * USAGE:
 * specimenDriftContract.parse({ relPath: 'src/if/a/a.ts', problem: 'differs' });
 * // Returns a SpecimenDrift
 */
import { z } from '#gateway/npm/zod';

export const specimenDriftContract = z
  .object({
    relPath: z.string().min(1).brand<'SpecimenDriftRelPath'>(),
    problem: z.enum(['differs', 'missing', 'extra']),
  })
  .brand<'SpecimenDrift'>();

export type SpecimenDrift = z.infer<typeof specimenDriftContract>;
