import { CoverageIdStub, DerivedTestCaseStub } from '@assayer/shared/contracts';

import { ProbeRuntimeStub } from '../../../contracts/probe-runtime/probe-runtime.stub';
import { jestInterpretCaseAdapter } from './jest-interpret-case-adapter';
import { jestInterpretCaseAdapterProxy } from './jest-interpret-case-adapter.proxy';

const THEN = CoverageIdStub({ value: 'grade/return@then' });
const ELSE = CoverageIdStub({ value: 'grade/return@else' });
const CALLBACK_EXIT = CoverageIdStub({ value: 'grade/cb/return@top' });

describe('jestInterpretCaseAdapter', () => {
  describe('judging against the PREDICTED exit', () => {
    it('VALID: {the entry reaches the predicted exit} => passes, recording the observed exit', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [{ kind: 'param', param: 'score', value: 6 }] });

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
        observedExit: THEN,
        trace: [{ id: THEN, kind: 'exit', valueText: '6' }],
      });
    });

    // The failure the runner exists to catch: the values derivation picked drive the flow somewhere
    // it did not predict. That is a soundness report on the ANALYZER, not a verdict on the code.
    it('VALID: {the entry reaches a DIFFERENT exit} => fails, recording both exits', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [{ kind: 'param', param: 'score', value: 0 }] });

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
        observedExit: ELSE,
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
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [] });

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
        observedExit: THEN,
        trace: [
          { id: THEN, kind: 'exit', valueText: 'entry' },
          { id: CALLBACK_EXIT, kind: 'exit', valueText: 'callback' },
        ],
      });
    });
  });

  describe('flows that never reach an exit', () => {
    it('ERROR: {the entry throws} => fails with the message and the trace it got to', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [] });

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
        trace: [],
        message: 'threw before reaching an exit: boom',
      });
    });

    it('EDGE: {the entry exits nowhere} => fails naming the entry rather than silently passing', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [] });

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
        trace: [],
        message: "reached no exit in 'grade'",
      });
    });

    it('EDGE: {the export is missing} => fails naming it, rather than crashing the whole file', () => {
      jestInterpretCaseAdapterProxy();
      const probe = ProbeRuntimeStub();
      const testCase = DerivedTestCaseStub({ reachesExit: THEN, arrange: [] });

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
        trace: [],
        message: "entry 'grade' is not an exported function — nothing to drive",
      });
    });
  });
});
