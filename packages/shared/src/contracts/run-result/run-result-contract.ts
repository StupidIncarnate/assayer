/**
 * PURPOSE: Contract for a saved run — the artifact BOTH surfaces read. Headless prints from it; the
 *   UI renders from it; neither recomputes anything the run did not record. That is why "run in the
 *   UI" and "run headless" cannot drift: they are not two implementations, they are one artifact
 *   produced by one CLI and read by two viewers.
 *
 *   Run artifacts are cache-resident and disposable — a run is an EVENT, not a derived fact, so
 *   nothing here is content-addressed and nothing is committed.
 *
 *   `gaps` rides here rather than stopping at the case set because a gap is Assayer telling a HUMAN
 *   what it could not drive, and it is worthless if only the cache knows. Required, not optional: a
 *   run reporting only its passes reads as complete coverage of the file, which is exactly the lie
 *   `darkSpots` exists to prevent.
 *
 * USAGE:
 * runResultContract.parse({ runId: 'r-17840…', relPath: 'src/boolean/and.ts', cases: [...], gaps: [] });
 * // Returns a validated RunResult (branded fields)
 */
import { z } from 'zod';

import { caseResultContract } from '../case-result/case-result-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const runResultContract = z.object({
  runId: runIdContract,
  relPath: relPathContract,
  cases: z.array(caseResultContract),
  gaps: z.array(z.object({ name: symbolNameContract, reason: z.string().min(1).brand<'RunGapReason'>() })),
});

export type RunResult = z.infer<typeof runResultContract>;
