/**
 * PURPOSE: Branded contract for a run's id — what addresses one saved run, in `assayer detail <id>`
 *   and on disk under `.assayer/cache/runs/<id>`.
 *
 *   It is CONTENT-keyed, never a timestamp: the same file bytes give the same id, so a detail link
 *   stays valid, re-running a file reuses its directory instead of accreting garbage, and two
 *   machines running the same code agree. A run is an event, but its NAME is a fact about the code.
 *
 * USAGE:
 * const runId = runIdContract.parse('b94b9541e49b3f0b…');
 * // Returns a validated RunId (branded)
 */
import { z } from 'zod';

export const runIdContract = z.string().min(1).brand<'RunId'>();

export type RunId = z.infer<typeof runIdContract>;
