/**
 * PURPOSE: Contract for a single source line — its 1-based line number, raw text, and a
 *   content hash used for cache-keying and diffing against derived artifacts.
 *
 * USAGE:
 * sourceLineContract.parse({
 *   n: 1,
 *   text: 'const x = 1;',
 *   hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 * });
 * // Returns a validated SourceLine (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract } from '../line-number/line-number-contract';

export const sourceLineContract = z.object({
  n: lineNumberContract,
  text: z.string().brand<'SourceLineText'>(),
  hash: z
    .string()
    .regex(/^[0-9a-f]{64}$/u)
    .brand<'LineHash'>(),
});

export type SourceLine = z.infer<typeof sourceLineContract>;
