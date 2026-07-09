/**
 * PURPOSE: Contract for a non-negative count of files (e.g. files touched, files covered).
 *
 * USAGE:
 * const count = fileCountContract.parse(42);
 * // Returns a validated FileCount (branded)
 */
import { z } from 'zod';

export const fileCountContract = z.number().int().nonnegative().brand<'FileCount'>();

export type FileCount = z.infer<typeof fileCountContract>;
