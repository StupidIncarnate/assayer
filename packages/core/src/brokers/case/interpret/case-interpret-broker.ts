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
 *   up, then one function is applied. An ARRAY binding marked `rest` is the one binding that is not
 *   ONE argument: its elements SPREAD across the tail positional slots the rest parameter stands for,
 *   because `Reflect.apply` is positional and a rest parameter collects everything from its own
 *   position onward — handing the whole array over as a single argument would nest it one level too
 *   deep (`ns` binding to `[[7]]` instead of `[7]`).
 *
 *   A HARNESS binding is an argument too, but its value is not in the case: the case names a key path and
 *   the value is whatever the colocated harness registered under it, loaded by the shim. A key the
 *   declaration does not carry is `errored` and NAMES the key — never a throw, and never a silent
 *   `undefined` slid into the argument list. The silent version is the worst outcome available here: the
 *   entry would run on a value nobody supplied and whatever it then did would be reported as a verdict.
 *   A harness binding marked `rest` resolves to an array too, and SPREADS across the tail positional
 *   slots exactly as a `rest`-marked array binding does — a harness answering `...sinks` hands over the
 *   array itself, never `[theArray]` nested one level too deep.
 *
 *   The environment is GLOBAL and shared by every case in the process, so it is snapshotted before
 *   the first write and restored in `finally` — including when the entry throws, which is exactly
 *   when an unrestored variable would go on to poison every case after it and make the failure look
 *   like it belongs to some other file. A variable that was ABSENT is restored to absent rather than
 *   to the empty string: `X=''` and no `X` are different inputs, and the code under test can tell. The
 *   same holds on the way in: an env binding with no value REMOVES its variable for the case.
 *
 *   The observed path is every trace exit event whose id is one of THIS ENTRY'S exits, in firing order;
 *   a case passes when the predicted `reachesPath` is a CONTIGUOUS SUFFIX of it — the last N observed exit
 *   events (N = `reachesPath.length`), in order, equal `reachesPath`, over a non-empty observed path. A scope
 *   evaluates left-to-right, so any noise — a short-circuit chain firing an exit probe per operand, as
 *   `return a && b && c` fires one for each — PRECEDES the real taken exit; the predicted path is therefore the
 *   TAIL of what was observed. A funnel case predicts `[innerExit, surfaceExit]` and matches cleanly against
 *   the whole observed path; a wrong funnel prediction still fails because the suffix is anchored end-to-front —
 *   change the second-to-last predicted id and the suffix no longer lines up. Filtering to the entry's own exits
 *   is what keeps a callback the entry invoked — which fires its own exit probe afterwards — from being counted
 *   as the entry's reach.
 *
 *   A throw is a real outcome, not a crash: the case is recorded with the message and whatever trace it
 *   got to, because "reached no exit" is exactly what a human needs told.
 *
 *   It reports THREE outcomes, and the split is the point. `passed` and `failed` are the two halves of
 *   one question — did the arrange reach the predicted exit — and only a case that actually reached an
 *   exit can answer it. The three ways to reach none (the entry is not callable, it threw, it ran to
 *   completion firing no exit probe) answer a different question, so they are `errored`: no verdict
 *   about the prediction exists. A reader who sees `failed` looks at the analyzer's derivation; a
 *   reader who sees `errored` looks at the arrange that was handed in. Reporting a thrown case as
 *   `failed` sends them to the wrong one.
 *
 *   What the entry returns is let finish before the probe events are read, through `caseSettleBroker`: a
 *   promise is awaited and a generator is iterated to its end. An async function's `return` after an
 *   `await`, a re-loaded ESM module's body, and a generator's body all run only then, and each is an exit
 *   the case predicts. The environment stays arranged until they finish. A generator that does not finish
 *   within the step limit is `errored`, and the message says the case stopped iterating it.
 *
 * USAGE:
 * await caseInterpretBroker({ entry, entryName, exitIds, testCase, probe, harness });
 * // Returns { entryName, testCase, status: 'passed', observedPath, trace }
 */
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';

import { caseResultContract } from '@assayer/shared/contracts';
import type { CaseResult, DerivedTestCase, Coverage } from '@assayer/shared/contracts';

import type { HarnessDeclaration } from '../../../contracts/harness-declaration/harness-declaration-contract';
import type { ProbeRuntime } from '../../../contracts/probe-runtime/probe-runtime-contract';
import { caseSettleStatics } from '../../../statics/case-settle/case-settle-statics';
import { harnessValueTransformer } from '../../../transformers/harness-value/harness-value-transformer';
import { caseSettleBroker } from '../settle/case-settle-broker';

export const caseInterpretBroker = async ({
  entry,
  entryName,
  exitIds,
  testCase,
  probe,
  harness,
}: {
  entry: unknown;
  entryName: string;
  exitIds: Coverage['id'][];
  testCase: DerivedTestCase;
  probe: ProbeRuntime;
  harness?: readonly HarnessDeclaration[] | undefined;
}): Promise<CaseResult> => {
  probe.reset();

  if (typeof entry !== 'function') {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'errored',
      trace: [],
      message: `entry '${entryName}' is not an exported function — nothing to drive`,
    });
  }

  // Every harness-supplied argument looked up BEFORE anything runs, so a key the declaration does not
  // carry stops the case instead of reaching the entry as a hole in the argument list.
  const supplied = testCase.arrange.flatMap((binding) =>
    binding.kind === 'harness'
      ? [
          {
            param: binding.param,
            key: binding.key,
            rest: binding.rest === true,
            resolved: harnessValueTransformer({ declarations: harness ?? [], key: binding.key }),
          },
        ]
      : [],
  );
  const missing = supplied.filter((binding) => !binding.resolved.found);

  if (missing.length > 0) {
    const plural = missing.length !== 1;

    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'errored',
      trace: [],
      message:
        `harness input${plural ? 's' : ''} ${missing.map((binding) => `\`${String(binding.key)}\``).join(', ')} ` +
        `${plural ? 'were' : 'was'} not registered when the colocated harness loaded, so '${entryName}' has no ` +
        `argument for ${missing.map((binding) => `\`${String(binding.param)}\``).join(', ')}. The case was derived ` +
        `from a declaration that named ${plural ? 'those keys' : 'that key'}, so the harness has changed since — ` +
        'restore the declaration, or recompile so the case set matches what it declares now.',
    });
  }

  const suppliedByParam = new Map(
    supplied.map((binding) => [String(binding.param), binding.resolved.found ? binding.resolved.value : undefined]),
  );

  // A param, an object and a harness input all apply positionally, so each contributes ONE argument in
  // arrange order; an env binding applies by writing a key, so it contributes none. A composite binding's
  // `value` is already the plain structure the entry receives — nested to whatever depth it carries
  // ({ db: { host: 'localhost' } } exactly as [[7]]) — so it needs no reconstruction. An ARRAY binding is
  // one exception: it contributes one argument UNLESS it realizes a REST parameter, in which case its
  // elements SPREAD across the tail positional slots the parameter stands for — `tally(11, ...[7])`, never
  // `tally(11, [7])`, which would bind `ns` to `[[7]]` instead of `[7]`. A HARNESS binding takes the SAME
  // exception for the SAME reason: a harness answering `...sinks` resolves to an array the interpreter
  // must spread, never hand over nested one level too deep.
  const args = testCase.arrange.flatMap((binding): unknown[] => {
    if (binding.kind === 'env') {
      return [];
    }

    if (binding.kind === 'harness') {
      const value = suppliedByParam.get(String(binding.param));

      return binding.rest === true && Array.isArray(value) ? value : [value];
    }

    return binding.kind === 'array' && binding.rest === true ? binding.value : [binding.value];
  });
  const envBindings = testCase.arrange.flatMap((binding) => (binding.kind === 'env' ? [binding] : []));
  // Snapshotted BEFORE the first write, so the restore below puts back what was there rather than
  // what this case put there.
  const restore = envBindings.map((binding) => ({ name: binding.name, prior: getEnv(binding.name) }));

  try {
    // A binding with no value leaves its variable UNSET, so it is removed rather than written: a
    // variable the outer process happens to hold would otherwise reach the code as a value the case
    // never arranged.
    for (const binding of envBindings) {
      if (binding.value === undefined) {
        deleteEnv(binding.name);
      } else {
        setEnv(binding.name, binding.value);
      }
    }

    // The result finishes running HERE, inside the environment the case arranged: an async entry's
    // exit after its first `await`, an ESM module's body once its import settles, and a generator's body
    // once something iterates it are all exits the case predicts.
    const finished = await caseSettleBroker({ result: Reflect.apply(entry, undefined, args) });

    if (!finished) {
      return caseResultContract.parse({
        entryName,
        testCase,
        status: 'errored',
        trace: probe.events,
        message:
          `'${entryName}' returned a generator that yielded ${String(caseSettleStatics.limits.generatorSteps)} values ` +
          'without finishing, so the case stopped iterating it before it reached an exit. A case drives a generator ' +
          'by iterating it to its end, so a generator that never ends reaches no exit a case can observe.',
      });
    }
  } catch (error) {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'errored',
      trace: probe.events,
      message: `threw before reaching an exit: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    for (const { name, prior } of restore) {
      if (prior === undefined) {
        deleteEnv(name);
      } else {
        setEnv(name, prior);
      }
    }
  }

  const observedPath = probe.events
    .filter((event) => event.kind === 'exit' && exitIds.includes(event.id))
    .map((event) => event.id);

  if (observedPath.length === 0) {
    return caseResultContract.parse({
      entryName,
      testCase,
      status: 'errored',
      trace: probe.events,
      message: `reached no exit in '${entryName}'`,
    });
  }

  const reachedPredictedPath =
    observedPath.length >= testCase.reachesPath.length &&
    testCase.reachesPath.every(
      (id, index) =>
        String(id) === String(observedPath[observedPath.length - testCase.reachesPath.length + index]),
    );

  return caseResultContract.parse({
    entryName,
    testCase,
    status: reachedPredictedPath ? 'passed' : 'failed',
    observedPath,
    trace: probe.events,
  });
};
