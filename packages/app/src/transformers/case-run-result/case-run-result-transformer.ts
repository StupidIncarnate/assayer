/**
 * PURPOSE: Finds the run's RESULT for one derived case — the whole verdict, not just its status.
 *
 *   It owns the identity match, and it is the only place that does. A case is matched on the exit it
 *   predicts plus the arrange that drives it, because the two lists come from different places: the
 *   derived cases are read from the analysis blob, the results from a run artifact that may be older.
 *   Matching by index would quietly attribute the wrong verdict the moment either list changed.
 *
 *   `salient` is deliberately OUT of that identity: it is a must-run display opinion, not part of what
 *   a case IS. A stale all-salient blob must still match a fresh run whose cases carry the same path
 *   and arrange, so the identity is exactly { reachesPath, arrange }.
 *
 *   Every reader of a case's verdict goes through here — the status a row renders and the message it
 *   explains itself with are two questions about ONE result, and two copies of the match would let the
 *   panel show a status from one case and a message from another.
 *
 *   Undefined means the case has no result — nobody has executed it.
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
  const identity = JSON.stringify({ reachesPath: testCase.reachesPath, arrange: testCase.arrange });

  return run?.cases.find(
    (candidate) =>
      JSON.stringify({ reachesPath: candidate.testCase.reachesPath, arrange: candidate.testCase.arrange }) === identity,
  );
};
