/**
 * PURPOSE: Contract for one derived case's outcome — what the analyzer PREDICTED, what the run
 *   OBSERVED, and the trace that got there.
 *
 *   The assertion is structural (P4): a case claims only that its arrange values reach a given exit,
 *   never that the exit returned anything in particular. So a failure means "the values the analyzer
 *   derived do not drive the flow where it said they would" — a soundness report on derivation, not
 *   a claim about whether the code is correct.
 *
 *   `failed` and `errored` are separate outcomes because they tell the reader to look at different
 *   things. `failed` means the case RAN, reached an exit, and it was not the predicted one — a
 *   disagreement between derivation and execution, which is about the analyzer. `errored` means no
 *   verdict about the prediction was produced at all: the entry threw, or was not callable, or
 *   reached no exit whatsoever. That is about the INPUTS — most often a parameter filled with a value
 *   the code cannot use. Folding them into one status is how "we handed a string to something that
 *   wanted an array" comes to look exactly like "the analyzer predicted the wrong arm", and only one
 *   of those is read by looking at the arrange.
 *
 * USAGE:
 * caseResultContract.parse({
 *   testCase, status: 'passed', observedPath: ['grade/return@then'], trace: [...],
 * });
 * // Returns a validated CaseResult (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { derivedTestCaseContract } from '../derived-test-case/derived-test-case-contract';
import { traceEventContract } from '../trace-event/trace-event-contract';
import { coverageContract } from '../coverage/coverage-contract';

export const caseResultContract = z.object({
  entryName: z.string().min(1).brand<'CaseEntryName'>(),
  testCase: derivedTestCaseContract,
  status: z.enum(['passed', 'failed', 'errored']).brand<'CaseStatus'>(),
  // The ordered exit path the run OBSERVED — the trace's exit events, in firing order, filtered to the
  // entry's own exits. Compared against the case's predicted `reachesPath`. Empty on every `errored`
  // outcome, since none of them reached an exit in the entry's scope — which is why a reader must not
  // read it as "came out here instead".
  observedPath: z.array(coverageContract.shape.id).default([]),
  trace: z.array(traceEventContract),
  message: z.string().brand<'CaseMessage'>().optional(),
}).brand<'CaseResult'>();

export type CaseResult = z.infer<typeof caseResultContract>;
