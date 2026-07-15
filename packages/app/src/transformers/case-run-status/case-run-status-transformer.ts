/**
 * PURPOSE: Finds what a run said about ONE derived case — passed, failed, or not run.
 *
 *   It matches on the case's own identity (the exit it predicts plus the arrange that drives it)
 *   rather than on position, because the two lists come from different places: the derived cases are
 *   read from the analysis blob, the results from a run artifact that may be older. Matching by index
 *   would quietly attribute the wrong verdict the moment either list changed.
 *
 *   `not-run` is a first-class answer, not a null: a case with no result is a case nobody has
 *   executed, and the UI must say that rather than imply it passed.
 *
 * USAGE:
 * caseRunStatusTransformer({ run, testCase });
 * // Returns 'passed' | 'failed' | 'not-run'
 */
import { caseRunStatusContract } from '../../contracts/case-run-status/case-run-status-contract';
import type { CaseRunStatus } from '../../contracts/case-run-status/case-run-status-contract';
import type { RunResult, DerivedTestCase } from '@assayer/shared/contracts';

export const caseRunStatusTransformer = ({
  run,
  testCase,
}: {
  run: RunResult | undefined;
  testCase: DerivedTestCase;
}): CaseRunStatus => {
  const identity = JSON.stringify(testCase);
  const result = run?.cases.find((candidate) => JSON.stringify(candidate.testCase) === identity);

  return caseRunStatusContract.parse(result === undefined ? 'not-run' : String(result.status));
};
