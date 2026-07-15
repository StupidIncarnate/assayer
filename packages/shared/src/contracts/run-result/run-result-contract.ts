/**
 * PURPOSE: Contract for a saved run — the artifact BOTH surfaces read. Headless prints from it; the
 *   UI renders from it; neither recomputes anything the run did not record. That is why "run in the
 *   UI" and "run headless" cannot drift: they are not two implementations, they are one artifact
 *   produced by one CLI and read by two viewers.
 *
 *   Run artifacts are cache-resident and disposable — a run is an EVENT, not a derived fact, so
 *   nothing here is content-addressed and nothing is committed.
 *
 * USAGE:
 * runResultContract.parse({ runId: 'r-17840…', relPath: 'src/boolean/and.ts', cases: [...] });
 * // Returns a validated RunResult (branded fields)
 */
import { z } from 'zod';

import { caseResultContract } from '../case-result/case-result-contract';
import { relPathContract } from '../rel-path/rel-path-contract';

export const runResultContract = z.object({
  runId: z.string().min(1).brand<'RunId'>(),
  relPath: relPathContract,
  cases: z.array(caseResultContract),
});

export type RunResult = z.infer<typeof runResultContract>;
