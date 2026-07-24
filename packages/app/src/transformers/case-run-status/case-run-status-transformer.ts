/**
 * PURPOSE: Finds what a run said about ONE derived case — passed, failed, errored, or not run.
 *
 *   Finding the result is `case-run-result`'s job, not this one's: the status a row renders and the
 *   message it explains itself with are two questions about ONE result, so the identity match lives in
 *   one place and both readers go through it.
 *
 *   `not-run` is a first-class answer, not a null: a case with no result is a case nobody has
 *   executed, and the UI must say that rather than imply it passed.
 *
 *   The run's own status is passed THROUGH rather than mapped: the artifact already distinguishes a
 *   case that reached the wrong exit from one that reached none, and re-deciding that here would be a
 *   second opinion about a run this transformer did not watch.
 *
 * USAGE:
 * caseRunStatusTransformer({ run, testCase });
 * // Returns 'passed' | 'failed' | 'errored' | 'not-run'
 */
import { caseRunStatusContract } from '../../contracts/case-run-status/case-run-status-contract';
import type { CaseRunStatus } from '../../contracts/case-run-status/case-run-status-contract';
import { caseRunResultTransformer } from '../case-run-result/case-run-result-transformer';
import type { RunResult, DerivedTestCase } from '@assayer/shared/contracts';

export const caseRunStatusTransformer = ({
  run,
  testCase,
}: {
  run: RunResult | undefined;
  testCase: DerivedTestCase;
}): CaseRunStatus => {
  const result = caseRunResultTransformer({ run, testCase });

  return caseRunStatusContract.parse(result === undefined ? 'not-run' : String(result.status));
};
