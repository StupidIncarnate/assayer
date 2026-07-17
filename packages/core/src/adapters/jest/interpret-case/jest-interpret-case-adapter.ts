/**
 * PURPOSE: Executes ONE derived case against a required module and judges it — the whole of what a
 *   generated test does.
 *
 *   What it asserts is structural (P4): the arrange values reach the exit the analyzer PREDICTED. It
 *   never asserts the returned value. So a failure means "the derived values do not drive the flow
 *   where derivation said they would" — a soundness report on the analyzer, not a verdict on the
 *   code. The observed value is recorded for DISPLAY only.
 *
 *   An arrange binding is applied according to what it IS. A param is an argument, positionally; an
 *   environment variable is a key written before the entry runs — which for a module scope is the
 *   entry running at all, since `entry` is then the thunk that re-imports it. That is the whole of
 *   what makes an uncallable scope drivable, and it needs no special case here: both kinds are set
 *   up, then one function is applied.
 *
 *   The environment is GLOBAL and shared by every case in the process, so it is snapshotted before
 *   the first write and restored in `finally` — including when the entry throws, which is exactly
 *   when an unrestored variable would go on to poison every case after it and make the failure look
 *   like it belongs to some other file. A variable that was ABSENT is restored to absent rather than
 *   to the empty string: `X=''` and no `X` are different inputs, and the code under test can tell.
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

  const args = testCase.arrange.flatMap((binding) => (binding.kind === 'param' ? [binding.value] : []));
  const envBindings = testCase.arrange.flatMap((binding) => (binding.kind === 'env' ? [binding] : []));
  // Snapshotted BEFORE the first write, so the restore below puts back what was there rather than
  // what this case put there.
  const restore = envBindings.map((binding) => ({ name: binding.name, prior: process.env[binding.name] }));

  try {
    for (const binding of envBindings) {
      process.env[binding.name] = binding.value;
    }

    Reflect.apply(entry, undefined, args);
  } catch (error) {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'failed',
      trace: probe.events,
      message: `threw before reaching an exit: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    for (const { name, prior } of restore) {
      if (prior === undefined) {
        Reflect.deleteProperty(process.env, name);
      } else {
        process.env[name] = prior;
      }
    }
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
