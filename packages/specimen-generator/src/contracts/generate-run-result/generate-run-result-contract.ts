/**
 * PURPOSE: What one run of the generator command hands back to its entry file: the text to print
 * and the exit code to end the process with. Reach for this when a command layer answers the entry
 * file, so the text and the code always travel together.
 *
 * USAGE:
 * generateRunResultContract.parse({ exitCode: 0, output: 'smoke-repo is current: 297 specimens' });
 * // Returns a GenerateRunResult
 */
import { z } from '#gateway/npm/zod';

export const generateRunResultContract = z
  .object({
    exitCode: z.number().int().min(0).brand<'GenerateRunResultExitCode'>(),
    output: z.string().brand<'GenerateRunResultOutput'>(),
  })
  .brand<'GenerateRunResult'>();

export type GenerateRunResult = z.infer<typeof generateRunResultContract>;
