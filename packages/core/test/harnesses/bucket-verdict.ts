/**
 * PURPOSE: Computes the run VERDICT a specimen's bucket claims — the run-side oracle the catalogue
 *   driver compares against folder position.
 *
 *   happy-path iff the run came out fully clean: at least one derived case, every case passed, and no
 *   admission on any channel (gaps, dark spots, undriven, lints). Anything else — a failing case, zero
 *   cases, or any admission — is sad-path.
 *
 *   Read off the RunResult the engine actually produced, NEVER the folder the specimen lives in. The
 *   whole value is that the two are independent: a human declares the bucket by choosing the folder,
 *   the engine reports what running it does, and a specimen that quietly started passing or quietly
 *   broke disagrees with its own folder and fails.
 *
 * USAGE:
 * bucketVerdict({ result }); // => 'happy-path' | 'sad-path'
 */
import type { RunResult } from '@assayer/shared/contracts';

export const bucketVerdict = ({ result }: { result: RunResult }): 'happy-path' | 'sad-path' =>
  result.cases.length > 0 &&
  result.cases.every((testCase) => String(testCase.status) === 'passed') &&
  result.gaps.length === 0 &&
  result.darkSpots.length === 0 &&
  result.undriven.length === 0 &&
  result.lints.length === 0
    ? 'happy-path'
    : 'sad-path';
