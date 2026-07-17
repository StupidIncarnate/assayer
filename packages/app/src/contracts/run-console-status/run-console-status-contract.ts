/**
 * PURPOSE: Contract for how a run ENDED, as the run console states it.
 *
 *   `failed` is a member rather than an absence, because a run that could not happen and a run that
 *   finished quietly both write no output — and a console that called both 'finished' would report
 *   the failure as a success.
 *
 *   It says THAT the run failed and never why: the reason is the detail panel's to tell, and a status
 *   that carried it would be a second copy of the error text.
 *
 * USAGE:
 * const status = runConsoleStatusContract.parse('failed');
 * // Returns a validated RunConsoleStatus (branded)
 */
import { z } from 'zod';

export const runConsoleStatusContract = z.enum(['running', 'finished', 'failed']).brand<'RunConsoleStatus'>();

export type RunConsoleStatus = z.infer<typeof runConsoleStatusContract>;
