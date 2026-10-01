/**
 * PURPOSE: Contract for a single entry in the repo file index — the repo-relative path of a
 *   discovered file.
 *
 * USAGE:
 * fileIndexEntryContract.parse({ relPath: 'packages/core/src/index.ts' });
 * // Returns a validated FileIndexEntry (branded relPath field)
 */
import { z } from '#gateway/npm/zod';


export const fileIndexEntryContract = z.object({
  relPath: z.string().min(1).brand<'FileIndexEntryRelPath'>(),
});

export type FileIndexEntry = z.infer<typeof fileIndexEntryContract>;
