/**
 * PURPOSE: Finds the run's RESULT for one derived case — the whole verdict, not just its status.
 *
 *   It owns the identity match, and it is the only place that does. A case is matched on the exit it
 *   predicts plus the arrange that drives it, because the two lists come from different places: the
 *   derived cases are read from the analysis blob, the results from a run artifact that may be older.
 *   Matching by index would quietly attribute the wrong verdict the moment either list changed.
 *
 *   `fewestRuns`, `driven` and `arms` are deliberately OUT of that identity: they say which set a case
 *   belongs to and which route it labels, not what the case IS. A stale blob must still match a fresh
 *   run whose cases carry the same path and arrange, so the identity is exactly { reachesPath, arrange }.
 *
 *   Only the run set is ever executed: a case that is undriven, or outside the fewest-runs set, has no
 *   result by definition, even when another case shares its exit and arrange. It is listed and never
 *   run, so it answers undefined here and reads as not run.
 *
 *   Every reader of a case's verdict goes through here — the status a row renders and the message it
 *   explains itself with are two questions about ONE result, and two copies of the match would let the
 *   panel show a status from one case and a message from another.
 *
 *   Undefined means the case has no result — nobody has executed it, or it is not in the run set.
 *
 * USAGE:
 * caseRunResultTransformer({ run, testCase });
 * // Returns the matching CaseResult, or undefined when the case has not been run
 */
import type { CaseResult, DerivedTestCase, RunResult } from '@assayer/shared/contracts';

export const caseRunResultTransformer = ({
  run,
  testCase,
}: {
  run: RunResult | undefined;
  testCase: DerivedTestCase;
}): CaseResult | undefined => {
  if (!testCase.driven || !testCase.fewestRuns) {
    return undefined;
  }

  const identity = JSON.stringify({ reachesPath: testCase.reachesPath, arrange: testCase.arrange });

  return run?.cases.find(
    (candidate) =>
      JSON.stringify({ reachesPath: candidate.testCase.reachesPath, arrange: candidate.testCase.arrange }) === identity,
  );
};
