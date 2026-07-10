/**
 * PURPOSE: Contract for the raw text contents of a file, including empty files.
 *
 * USAGE:
 * const contents = fileContentsContract.parse('export const x = 1;\n');
 * // Returns a validated FileContents (branded)
 */
import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();

export type FileContents = z.infer<typeof fileContentsContract>;
