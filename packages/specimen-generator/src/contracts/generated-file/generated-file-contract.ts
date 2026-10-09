/**
 * PURPOSE: One file the generator wants on disk: a path under the output root and its full text.
 * Reach for this over refusedSpecimenContract when the file was written, not rejected.
 *
 * USAGE:
 * generatedFileContract.parse({ relPath: 'packages/syntax-repository/specimen-manifest.json', content: '[]' });
 * // Returns a GeneratedFile
 */
import { z } from '#gateway/npm/zod';

export const generatedFileContract = z
  .object({
    relPath: z.string().min(1).brand<'GeneratedFileRelPath'>(),
    content: z.string().brand<'GeneratedFileContent'>(),
  })
  .brand<'GeneratedFile'>();

export type GeneratedFile = z.infer<typeof generatedFileContract>;
