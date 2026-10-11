/**
 * PURPOSE: Answers whether the runner runs ONE derived case. A case runs only when Assayer can steer
 *   every branch on its route (`driven`) AND it belongs to the set `run-case-set` names: the fewest-runs
 *   subset, or every route. An undriven case is listed in the entry's every-route set and never run.
 *
 *   This is the only reader of `runCaseSetStatics.runs`, so which set runs is decided in exactly one place.
 *
 * USAGE:
 * isRunCaseGuard({ testCase: { driven: true, fewestRuns: true } });
 * // Returns true under the fewest-runs setting
 */
import type { DerivedTestCase } from '@assayer/shared/contracts';

import { runCaseSetStatics } from '../../statics/run-case-set/run-case-set-statics';

export const isRunCaseGuard = ({ testCase }: { testCase?: Pick<DerivedTestCase, 'driven' | 'fewestRuns'> }): boolean =>
  testCase !== undefined &&
  testCase.driven &&
  (runCaseSetStatics.runs === 'fewest-runs' ? testCase.fewestRuns : true);
