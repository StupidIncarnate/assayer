import { CoverageIdStub, DerivedTestCaseStub } from '@assayer/shared/contracts';

import { ProbeRuntimeStub } from '../../../contracts/probe-runtime/probe-runtime.stub';
import { jestInterpretCaseAdapter } from './jest-interpret-case-adapter';
import { jestInterpretCaseAdapterProxy } from './jest-interpret-case-adapter.proxy';

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

describe('jestInterpretCaseAdapter', () => {
  describe('judging against the PREDICTED exit', () => {
    it('VALID: {the entry reaches the predicted exit} => passes, recording the observed exit', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'param', param: 'score', value: 6 }] });

      const result = jestInterpretCaseAdapter({
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
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [{ kind: 'param', param: 'score', value: 0 }] });

      const result = jestInterpretCaseAdapter({
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

  describe("exits that are not the entry's own", () => {
    // The bug this guards: a callback the entry invoked fires its own exit probe AFTER the entry's,
    // so "the last exit event" would judge the entry by code it merely scheduled.
    it("EDGE: {a callback exits after the entry} => judged on the ENTRY's exit, not the last one", () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = jestInterpretCaseAdapter({
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
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [AND_ALL_THEN], arrange: [] });

      const result = jestInterpretCaseAdapter({
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
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [INNER, SURFACE], arrange: [] });

      const result = jestInterpretCaseAdapter({
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
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [OTHER, SURFACE], arrange: [] });

      const result = jestInterpretCaseAdapter({
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

  describe('flows that never reach an exit', () => {
    it('ERROR: {the entry throws} => fails with the message and the trace it got to', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = jestInterpretCaseAdapter({
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
        status: 'failed',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: boom',
      });
    });

    it('EDGE: {the entry exits nowhere} => fails naming the entry rather than silently passing', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = jestInterpretCaseAdapter({
        entry: () => undefined,
        entryName: 'grade',
        exitIds: [THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'failed',
        observedPath: [],
        trace: [],
        message: "reached no exit in 'grade'",
      });
    });

    it('EDGE: {the export is missing} => fails naming it, rather than crashing the whole file', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesPath: [THEN], arrange: [] });

      const result = jestInterpretCaseAdapter({
        entry: undefined,
        entryName: 'grade',
        exitIds: [THEN],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'grade',
        testCase,
        status: 'failed',
        observedPath: [],
        trace: [],
        message: "entry 'grade' is not an exported function — nothing to drive",
      });
    });
  });
});
