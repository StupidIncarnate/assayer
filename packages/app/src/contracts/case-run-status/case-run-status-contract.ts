/**
 * PURPOSE: Contract for what a run said about one derived case, as the UI shows it.
 *
 *   `not-run` is a member rather than an absence, because "nobody has executed this" is a fact the
 *   reader needs told. Modelling it as null would let a case with no result render the same as a case
 *   that passed, which is the one thing this display must never do.
 *
 * USAGE:
 * const status = caseRunStatusContract.parse('not-run');
 * // Returns a validated CaseRunStatus (branded)
 */
import { z } from 'zod';

export const caseRunStatusContract = z.enum(['passed', 'failed', 'not-run']).brand<'CaseRunStatus'>();

export type CaseRunStatus = z.infer<typeof caseRunStatusContract>;
