/**
 * PURPOSE: Everything one generator run produces, held in memory before anything is written or
 * compared: the files, the refused combinations and the manifest. The write step and the check
 * step both read this, so they cannot disagree about what was generated.
 *
 * USAGE:
 * generationResultContract.parse({ files: [], refused: [], manifest: [] });
 * // Returns a GenerationResult
 */
import { z } from '#gateway/npm/zod';

import { generatedFileContract } from '../generated-file/generated-file-contract';
import { manifestEntryContract } from '../manifest-entry/manifest-entry-contract';
import { refusedSpecimenContract } from '../refused-specimen/refused-specimen-contract';

export const generationResultContract = z
  .object({
    files: z.array(generatedFileContract),
    refused: z.array(refusedSpecimenContract),
    manifest: z.array(manifestEntryContract),
  })
  .brand<'GenerationResult'>();

export type GenerationResult = z.infer<typeof generationResultContract>;
