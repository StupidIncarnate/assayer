/**
 * PURPOSE: Contract for a compile status — whether the last compile of the analyzed repo
 *   succeeded or produced errors.
 *
 * USAGE:
 * const status = compileStatusContract.parse('ok');
 * // Returns a validated CompileStatus (branded)
 */
import { z } from 'zod';

export const compileStatusContract = z.enum(['ok', 'errors']).brand<'CompileStatus'>();

export type CompileStatus = z.infer<typeof compileStatusContract>;
