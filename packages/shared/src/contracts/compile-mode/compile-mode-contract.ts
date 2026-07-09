/**
 * PURPOSE: Contract for a compile mode — how the last compile of the analyzed repo was run
 *   (a full net-new compile, an incremental recompile, or skipped entirely).
 *
 * USAGE:
 * const mode = compileModeContract.parse('net-new');
 * // Returns a validated CompileMode (branded)
 */
import { z } from 'zod';

export const compileModeContract = z.enum(['net-new', 'incremental', 'skipped']).brand<'CompileMode'>();

export type CompileMode = z.infer<typeof compileModeContract>;
