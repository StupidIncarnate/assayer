/**
 * PURPOSE: Contract for a folder name — a non-empty identifier for a directory node in the
 *   analyzed repo's file tree.
 *
 * USAGE:
 * const name = folderNameContract.parse('smoke-repo');
 * // Returns a validated FolderName (branded)
 */
import { z } from 'zod';

export const folderNameContract = z.string().min(1).brand<'FolderName'>();

export type FolderName = z.infer<typeof folderNameContract>;
