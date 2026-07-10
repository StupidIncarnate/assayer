/**
 * PURPOSE: Contract for an absolute file path on disk, non-empty.
 *
 * USAGE:
 * const path = filePathContract.parse('/repo/src/index.ts');
 * // Returns a validated FilePath (branded)
 */
import { z } from 'zod';

export const filePathContract = z.string().min(1).brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;
