/**
 * PURPOSE: Contract for one derived case's outcome — what the analyzer PREDICTED, what the run
 *   OBSERVED, and the trace that got there.
 *
 *   The assertion is structural (P4): a case claims only that its arrange values reach a given exit,
 *   never that the exit returned anything in particular. So a failure means "the values the analyzer
 *   derived do not drive the flow where it said they would" — a soundness report on derivation, not
 *   a claim about whether the code is correct.
 *
 * USAGE:
 * caseResultContract.parse({
 *   testCase, status: 'passed', observedPath: ['grade/return@then'], trace: [...],
 * });
 * // Returns a validated CaseResult (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { derivedTestCaseContract } from '../derived-test-case/derived-test-case-contract';
import { traceEventContract } from '../trace-event/trace-event-contract';

export const caseResultContract = z.object({
  entryName: z.string().min(1).brand<'CaseEntryName'>(),
  testCase: derivedTestCaseContract,
  status: z.enum(['passed', 'failed']).brand<'CaseStatus'>(),
  // The ordered exit path the run OBSERVED — the trace's exit events, in firing order, filtered to the
  // entry's own exits. Compared against the case's predicted `reachesPath`. Empty when the flow reached
  // NO exit in the entry's scope (a case that threw, or an entry that could not be driven at all),
  // which is distinct from reaching a wrong path.
  observedPath: z.array(coverageIdContract).default([]),
  trace: z.array(traceEventContract),
  message: z.string().brand<'CaseMessage'>().optional(),
});

export type CaseResult = z.infer<typeof caseResultContract>;
