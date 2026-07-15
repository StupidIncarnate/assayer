/**
 * PURPOSE: Executes ONE derived case against a required module and judges it — the whole of what a
 *   generated test does.
 *
 *   What it asserts is structural (P4): the arrange values reach the exit the analyzer PREDICTED. It
 *   never asserts the returned value. So a failure means "the derived values do not drive the flow
 *   where derivation said they would" — a soundness report on the analyzer, not a verdict on the
 *   code. The observed value is recorded for DISPLAY only.
 *
 *   The reached exit is the last trace event whose id is one of THIS ENTRY'S exits. Taking the last
 *   exit event outright is wrong: a callback the entry invoked fires its own exit probe afterwards,
 *   so the entry would be judged by code it merely scheduled.
 *
 *   A throw is a real outcome, not a crash: the case fails with the message and whatever trace it got
 *   to, because "reached no exit" is exactly what a human needs told.
 *
 * USAGE:
 * jestInterpretCaseAdapter({ entry, entryName, exitIds, testCase, probe });
 * // Returns { entryName, testCase, status: 'passed', observedExit, trace }
 */
import { caseResultContract } from '@assayer/shared/contracts';
import type { CaseResult, CoverageId, DerivedTestCase } from '@assayer/shared/contracts';

import type { ProbeRuntime } from '../../../contracts/probe-runtime/probe-runtime-contract';

export const jestInterpretCaseAdapter = ({
  entry,
  entryName,
  exitIds,
  testCase,
  probe,
}: {
  entry: unknown;
  entryName: string;
  exitIds: CoverageId[];
  testCase: DerivedTestCase;
  probe: ProbeRuntime;
}): CaseResult => {
  probe.reset();

  if (typeof entry !== 'function') {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'failed',
      trace: [],
      message: `entry '${entryName}' is not an exported function — nothing to drive`,
    });
  }

  const args = testCase.arrange.map((binding) => binding.value);

  try {
    Reflect.apply(entry, undefined, args);
  } catch (error) {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'failed',
      trace: probe.events,
      message: `threw before reaching an exit: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const reached = probe.events.filter((event) => event.kind === 'exit' && exitIds.includes(event.id)).at(-1);

  if (reached === undefined) {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'failed',
      trace: probe.events,
      message: `reached no exit in '${entryName}'`,
    });
  }

  return caseResultContract.parse({
    entryName,
    testCase,
    status: reached.id === testCase.reachesExit ? 'passed' : 'failed',
    observedExit: reached.id,
    trace: probe.events,
  });
};
