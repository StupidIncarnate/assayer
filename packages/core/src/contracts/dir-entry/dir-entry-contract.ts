/**
 * PURPOSE: Contract for a single directory listing entry — its name and whether it is itself a
 *   directory, as returned by a filesystem directory read.
 *
 * USAGE:
 * dirEntryContract.parse({ name: 'index.ts', isDirectory: false });
 * // Returns a validated DirEntry (branded name field)
 */
import { z } from 'zod';

export const dirEntryContract = z.object({
  name: z.string().min(1).brand<'DirEntryName'>(),
  isDirectory: z.boolean(),
});

export type DirEntry = z.infer<typeof dirEntryContract>;
