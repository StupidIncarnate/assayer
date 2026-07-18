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
 *   `darkSpots` rides along for that same reason, and is a DIFFERENT admission from a gap. A gap is
 *   the caller's debt — Assayer understood the entry and could not construct it, so a harness fixes
 *   it. A dark spot is ASSAYER's debt — it did not understand the syntax at all, and no harness the
 *   caller writes can help. Reporting them as one kind would tell a reader to fix a for-loop they
 *   cannot fix.
 *
 *   `undriven` is the third, and required for the same reason both of the others are. It is logic
 *   Assayer read perfectly and never drove, because its execution model does not reach there yet — a
 *   module scope runs at import time and takes no inputs; a private helper is reachable only through
 *   its callers. Neither of the other two channels can hold that: a gap would order a harness nobody
 *   can write, a dark spot would blame a parser that was not blind. Without it a file whose ONLY
 *   logic is undriven reports `cases: [], gaps: [], darkSpots: []` — byte-identical to full coverage.
 *
 * USAGE:
 * runResultContract.parse({ runId: 'r-17840…', relPath: 'src/boolean/and.ts', cases: [...], gaps: [], darkSpots: [], undriven: [] });
 * // Returns a validated RunResult (branded fields)
 */
import { z } from 'zod';

import { caseResultContract } from '../case-result/case-result-contract';
import { darkSpotContract } from '../dark-spot/dark-spot-contract';
import { lintEntryContract } from '../lint-entry/lint-entry-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { undrivenEntryContract } from '../undriven-entry/undriven-entry-contract';

export const runResultContract = z.object({
  runId: runIdContract,
  relPath: relPathContract,
  cases: z.array(caseResultContract),
  gaps: z.array(z.object({ name: symbolNameContract, reason: z.string().min(1).brand<'RunGapReason'>() })),
  darkSpots: z.array(darkSpotContract),
  undriven: z.array(undrivenEntryContract),
  // The fourth channel — patterns the repo should change, carried so `assayer unit` can fail on them
  // when the repo asked (`deadSurface: 'error'`), exactly as it fails on a dark spot under its toggle.
  lints: z.array(lintEntryContract),
});

export type RunResult = z.infer<typeof runResultContract>;
