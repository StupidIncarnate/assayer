import { CoverageIdStub } from '@assayer/shared/contracts/coverage-id/coverage-id.stub';
import { DerivedTestCaseStub } from '@assayer/shared/contracts/derived-test-case/derived-test-case.stub';

import { ProbeRuntimeStub } from '../../../contracts/probe-runtime/probe-runtime.stub';
import { caseInterpretBroker } from './case-interpret-broker';
import { caseInterpretBrokerProxy } from './case-interpret-broker.proxy';
import { getEnv } from '#gateway/node/process';

const THEN = CoverageIdStub({ value: 'grade/return@then' });
const ELSE = CoverageIdStub({ value: 'grade/return@else' });
const CALLBACK_EXIT = CoverageIdStub({ value: 'grade/cb/return@top' });

// A value-position short-circuit chain (`return a && b && c`) fires one exit probe per operand, so the
// ACTUAL taken exit is the LAST event and the earlier ones are noise the predicted path does not name.
const AND_A_ELSE = CoverageIdStub({ value: 'all/return@a#else' });
const AND_B_ELSE = CoverageIdStub({ value: 'all/return@a#then/b#else' });
const AND_ALL_THEN = CoverageIdStub({ value: 'all/return@a#then/b#then' });

// A funnel case predicts a two-event path; a wrong prediction differs at the non-final id.
const INNER = CoverageIdStub({ value: 'funnel/inner@then' });
const SURFACE = CoverageIdStub({ value: 'funnel/surface@top' });
const OTHER = CoverageIdStub({ value: 'funnel/other@else' });

describe('caseInterpretBroker', () => {
  describe('judging against the PREDICTED exit', () => {
    it('VALID: {the entry reaches the predicted exit} => passes, recording the observed exit', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'param', param: 'score', value: 6 }] });

      const result = caseInterpretBroker({
        entry: (score: number) => probe.x(THEN, score),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '6' }],
      });
    });

    // The failure the runner exists to catch: the values derivation picked drive the flow somewhere
    // it did not predict. That is a soundness report on the ANALYZER, not a verdict on the code.
    it('VALID: {the entry reaches a DIFFERENT exit} => fails, recording both exits', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'param', param: 'score', value: 0 }] });

      const result = caseInterpretBroker({
        entry: (score: number) => probe.x(ELSE, score),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'failed',
        observedPath: [ELSE],
        trace: [{ id: ELSE, kind: 'exit', valueText: '0' }],
      });
    });
  });

  describe('composite bindings become one argument each', () => {
    // A nested object arrives whole, exactly as a nested array does — the binding's value IS the
    // structure the entry receives, so the entry can read straight through `config.db.host`.
    it('VALID: {a nested object binding} => passed positionally with its nesting intact', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [{ kind: 'object', param: 'config', value: { db: { host: 'localhost' } } }],
      });

      const result = caseInterpretBroker({
        entry: (config: unknown) => probe.x(THEN, JSON.stringify(config)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '{"db":{"host":"localhost"}}' }],
      });
    });

    it('VALID: {an object binding beside a scalar} => both arguments in arrange order', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'object', param: 'config', value: { db: { ports: [7] } } },
          { kind: 'param', param: 'retries', value: 2 },
        ],
      });

      const result = caseInterpretBroker({
        entry: (config: unknown, retries: unknown) => probe.x(THEN, JSON.stringify([config, retries])),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '[{"db":{"ports":[7]}},2]' }],
      });
    });
  });

  describe('an array binding is one argument, UNLESS it realizes a rest parameter', () => {
    it('VALID: {an ordinary array param} => the whole array arrives as ONE argument', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [{ kind: 'array', param: 'items', value: [6, 9] }],
      });

      const result = caseInterpretBroker({
        entry: (items: unknown) => probe.x(THEN, JSON.stringify(items)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '[6,9]' }],
      });
    });

    // The case that would have caught A5: reading an ELEMENT of the rest array, not merely its
    // `.length`. Applied as one argument, `ns` would bind to `[[6, 9]]` and `ns[0]` would read an
    // array instead of `6`, so this fails against the bug and passes against the fix.
    it('VALID: {a rest param, two elements} => the elements SPREAD across the tail positional slots', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'size', value: 11 },
          { kind: 'array', param: 'ns', value: [6, 9], rest: true },
        ],
      });

      const result = caseInterpretBroker({
        entry: (size: unknown, ...ns: unknown[]) => probe.x(THEN, `${String(size)}:${String(ns[0])}:${String(ns[1])}`),
        entryName: 'tally',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'tally',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '11:6:9' }],
      });
    });

    it('VALID: {a rest param, no elements} => contributes no argument, so the rest binds empty', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'size', value: 11 },
          { kind: 'array', param: 'ns', value: [], rest: true },
        ],
      });

      const result = caseInterpretBroker({
        entry: (size: unknown, ...ns: unknown[]) => probe.x(THEN, `${String(size)}:${ns.length}`),
        entryName: 'tally',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'tally',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '11:0' }],
      });
    });
  });

  describe('a harness binding resolves against the loaded declaration', () => {
    it('VALID: {inputs.grade.report declared} => the registered callback is applied positionally', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'score', value: 6 },
          { kind: 'harness', param: 'report', key: 'inputs.grade.report' },
        ],
      });

      const result = caseInterpretBroker({
        entry: (score: unknown, report: unknown) => probe.x(THEN, `${String(score)}:${String(report)}`),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
        harness: [{ inputs: { grade: { report: 'the-declared-value' } } }],
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '6:the-declared-value' }],
      });
    });

    // The case that would have caught the trailing-rest-parameter defect: a harness answering a REST
    // parameter resolves to an array, and applied as ONE argument it would bind `sinks` to `[[cb]]`
    // instead of `[cb]` — `sinks[0]` would then read an array, not the callback. Fails against the bug,
    // passes against the fix.
    it('VALID: {inputs.collect.sinks declared, rest: true} => the resolved array SPREADS across the tail slots', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'size', value: 7 },
          { kind: 'harness', param: 'sinks', key: 'inputs.collect.sinks', rest: true },
        ],
      });

      const result = caseInterpretBroker({
        entry: (size: unknown, ...sinks: unknown[]) => probe.x(THEN, `${String(size)}:${sinks.length}`),
        entryName: 'collect',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
        harness: [{ inputs: { collect: { sinks: ['sink-a', 'sink-b'] } } }],
      });

      expect(result).toStrictEqual({
        entryName: 'collect',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '7:2' }],
      });
    });

    // The one outcome that must never be silent. A hole in the argument list would let the entry run on
    // a value nobody supplied, and whatever it then did would be reported as a verdict about the code.
    it('ERROR: {the key is not declared} => errored, NAMING the key, without calling the entry', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [{ kind: 'harness', param: 'report', key: 'inputs.grade.report' }],
      });

      const result = caseInterpretBroker({
        entry: (report: unknown) => probe.x(THEN, String(report)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
        harness: [{ inputs: { grade: { emit: 'the-other-value' } } }],
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message:
          'harness input `inputs.grade.report` was not registered when the colocated harness loaded, so ' +
          "'grade' has no argument for `report`. The case was derived from a declaration that named that " +
          'key, so the harness has changed since — restore the declaration, or recompile so the case set ' +
          'matches what it declares now.',
      });
    });

    it('EMPTY: {no harness loaded at all} => errored, naming the key rather than passing undefined', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [{ kind: 'harness', param: 'report', key: 'inputs.grade.report' }],
      });

      const result = caseInterpretBroker({
        entry: (report: unknown) => probe.x(THEN, String(report)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message:
          'harness input `inputs.grade.report` was not registered when the colocated harness loaded, so ' +
          "'grade' has no argument for `report`. The case was derived from a declaration that named that " +
          'key, so the harness has changed since — restore the declaration, or recompile so the case set ' +
          'matches what it declares now.',
      });
    });

    it('ERROR: {two keys missing} => errored, naming BOTH, so one recompile closes them together', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({
        reachesPath: [THEN],
        arrange: [
          { kind: 'harness', param: 'report', key: 'inputs.grade.report' },
          { kind: 'harness', param: 'emit', key: 'inputs.grade.emit' },
        ],
      });

      const result = caseInterpretBroker({
        entry: (report: unknown) => probe.x(THEN, String(report)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
        harness: [{ inputs: {} }],
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message:
          'harness inputs `inputs.grade.report`, `inputs.grade.emit` were not registered when the ' +
          "colocated harness loaded, so 'grade' has no argument for `report`, `emit`. The case was " +
          'derived from a declaration that named those keys, so the harness has changed since — restore ' +
          'the declaration, or recompile so the case set matches what it declares now.',
      });
    });
  });

  describe('an env binding is written before the call and restored after', () => {
    // Snapshotted BEFORE the first write, so an absent variable comes back absent rather than ''.
    it('VALID: {an env binding, no prior value} => visible to the entry, then restored to absent', () => {
      caseInterpretBrokerProxy();
      const NAME = 'ASSAYER_JEST_INTERPRET_CASE_ENV_ABSENT';
      Reflect.deleteProperty(process.env, NAME);
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'env', name: NAME, value: '6' }] });

      const result = caseInterpretBroker({
        entry: () => probe.x(THEN, getEnv(NAME)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '6' }],
      });
      expect(getEnv(NAME)).toBe(undefined);
    });

    it('VALID: {an env binding, a prior value} => visible to the entry, then restored to the prior value', () => {
      caseInterpretBrokerProxy();
      const NAME = 'ASSAYER_JEST_INTERPRET_CASE_ENV_PRIOR';
      process.env[NAME] = 'prior-value';
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'env', name: NAME, value: '6' }] });

      const result = caseInterpretBroker({
        entry: () => probe.x(THEN, getEnv(NAME)),
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });
      const restoredValue = getEnv(NAME);
      Reflect.deleteProperty(process.env, NAME);

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [{ id: THEN, kind: 'exit', valueText: '6' }],
      });
      expect(restoredValue).toBe('prior-value');
    });

    // The case the PURPOSE doc calls out by name: an unrestored variable would poison every case that
    // runs after this one, and a throw must not skip the restore in `finally`.
    it('ERROR: {the entry throws with an env binding set} => still restored to the prior value', () => {
      caseInterpretBrokerProxy();
      const NAME = 'ASSAYER_JEST_INTERPRET_CASE_ENV_THROW';
      process.env[NAME] = 'prior-value';
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'env', name: NAME, value: '6' }] });

      const result = caseInterpretBroker({
        entry: () => {
          throw new Error('boom');
        },
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });
      const restoredValue = getEnv(NAME);
      Reflect.deleteProperty(process.env, NAME);

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: boom',
      });
      expect(restoredValue).toBe('prior-value');
    });
  });

  describe("exits that are not the entry's own", () => {
    // The bug this guards: a callback the entry invoked fires its own exit probe AFTER the entry's,
    // so "the last exit event" would judge the entry by code it merely scheduled.
    it("EDGE: {a callback exits after the entry} => judged on the ENTRY's exit, not the last one", () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => {
          probe.x(THEN, 'entry');
          probe.x(CALLBACK_EXIT, 'callback');
        },
        entryName: 'grade',
        exitIds: [THEN, ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'passed',
        observedPath: [THEN],
        trace: [
          { id: THEN, kind: 'exit', valueText: 'entry' },
          { id: CALLBACK_EXIT, kind: 'exit', valueText: 'callback' },
        ],
      });
    });
  });

  describe('predicting the TAIL of the observed trace', () => {
    // `return a && b && c` on (true, true, false) fires an exit probe per operand, so the observed trace
    // is three events and the analyzer predicts only the last. Exact equality would fail 3-vs-1; the
    // contiguous suffix passes because the predicted id is the last observed one.
    it('VALID: {a short-circuit chain fires an exit per operand} => passes on the predicted suffix', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [AND_ALL_THEN], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => {
          probe.x(AND_A_ELSE, false);
          probe.x(AND_B_ELSE, false);
          probe.x(AND_ALL_THEN, true);
        },
        entryName: 'all',
        exitIds: [AND_A_ELSE, AND_B_ELSE, AND_ALL_THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'all',
        testCase,
        status: 'passed',
        observedPath: [AND_A_ELSE, AND_B_ELSE, AND_ALL_THEN],
        trace: [
          { id: AND_A_ELSE, kind: 'exit', valueText: 'false' },
          { id: AND_B_ELSE, kind: 'exit', valueText: 'false' },
          { id: AND_ALL_THEN, kind: 'exit', valueText: 'true' },
        ],
      });
    });

    // A funnel case predicts a two-event path; here it is the WHOLE observed trace, so the suffix is the
    // whole path and it matches cleanly.
    it('VALID: {a funnel case predicts [inner, surface]} => passes on the whole observed path', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [INNER, SURFACE], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => {
          probe.x(INNER, 'inner');
          probe.x(SURFACE, 'surface');
        },
        entryName: 'funnel',
        exitIds: [INNER, SURFACE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'funnel',
        testCase,
        status: 'passed',
        observedPath: [INNER, SURFACE],
        trace: [
          { id: INNER, kind: 'exit', valueText: 'inner' },
          { id: SURFACE, kind: 'exit', valueText: 'surface' },
        ],
      });
    });

    // The suffix is anchored end-to-front: the last observed id lines up but the second-to-last predicted
    // id does not, so the case still fails. A wrong funnel prediction is not rescued by a matching final id.
    it('VALID: {a funnel prediction whose non-final id is wrong} => fails, the suffix not lining up', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [OTHER, SURFACE], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => {
          probe.x(INNER, 'inner');
          probe.x(SURFACE, 'surface');
        },
        entryName: 'funnel',
        exitIds: [INNER, SURFACE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'funnel',
        testCase,
        status: 'failed',
        observedPath: [INNER, SURFACE],
        trace: [
          { id: INNER, kind: 'exit', valueText: 'inner' },
          { id: SURFACE, kind: 'exit', valueText: 'surface' },
        ],
      });
    });
  });

  // All three reach NO exit, so none of them can say anything about the predicted one. They are
  // `errored` rather than `failed` for that reason and no other: `failed` is reserved for a case that
  // ran, came out an exit, and came out the wrong one. Reported as `failed`, a parameter filled with a
  // value the code cannot use reads exactly like a mispredicted arm, and the reader is sent to the
  // analyzer instead of to the arrange.
  describe('flows that never reach an exit', () => {
    it('ERROR: {the entry throws} => errored with the message and the trace it got to', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => {
          throw new Error('boom');
        },
        entryName: 'grade',
        exitIds: [THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: boom',
      });
    });

    it('EDGE: {the entry exits nowhere} => errored naming the entry rather than silently passing', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = caseInterpretBroker({
        entry: () => undefined,
        entryName: 'grade',
        exitIds: [THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message: "reached no exit in 'grade'",
      });
    });

    it('EDGE: {the export is missing} => errored naming it, rather than crashing the whole file', () => {
      caseInterpretBrokerProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = caseInterpretBroker({
        entry: undefined,
        entryName: 'grade',
        exitIds: [THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message: "entry 'grade' is not an exported function — nothing to drive",
      });
    });
  });
});
