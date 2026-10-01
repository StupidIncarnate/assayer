/**
 * PURPOSE: Contract for what a run said about one derived case, as the UI shows it.
 *
 *   `not-run` is a member rather than an absence, because "nobody has executed this" is a fact the
 *   reader needs told. Modelling it as null would let a case with no result render the same as a case
 *   that passed, which is the one thing this display must never do.
 *
 *   `errored` mirrors the run artifact's own third outcome and is never collapsed into `failed`. A
 *   failed case reached the wrong exit, so the reader looks at the derivation; an errored one reached
 *   none — it threw, was not callable, or fired no exit probe — so the reader looks at the arrange. A
 *   panel that shows one marker for both makes a parameter filled with an unusable value look exactly
 *   like a mispredicted arm.
 *
 * USAGE:
 * const status = caseRunStatusContract.parse('not-run');
 * // Returns a validated CaseRunStatus (branded)
 */
import { z } from '#gateway/npm/zod';

export const caseRunStatusContract = z.enum(['passed', 'failed', 'errored', 'not-run']).brand<'CaseRunStatus'>();

export type CaseRunStatus = z.infer<typeof caseRunStatusContract>;
