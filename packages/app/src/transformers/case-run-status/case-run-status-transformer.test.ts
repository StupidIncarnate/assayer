import { RunResultStub, CaseResultStub } from '@assayer/shared/contracts';

import { caseRunStatusTransformer } from './case-run-status-transformer';

describe('caseRunStatusTransformer', () => {
  describe('a case the run covered', () => {
    it('VALID: {a passing case} => passed', () => {
      const run = RunResultStub();

      const result = caseRunStatusTransformer({ run, testCase: CaseResultStub().testCase });

      expect(String(result)).toBe('passed');
    });

    it('VALID: {a failing case} => failed', () => {
      const run = RunResultStub({ cases: [CaseResultStub({ status: 'failed' })] });

      const result = caseRunStatusTransformer({ run, testCase: CaseResultStub().testCase });

      expect(String(result)).toBe('failed');
    });
  });

  describe('a case the run did not cover', () => {
    // Matched on the case's own identity, never position: the derived cases come from the analysis
    // blob and the results from an artifact that may be older, so an index would attribute the wrong
    // verdict the moment either list changed.
    it('VALID: {a different arrange} => not-run rather than the neighbour verdict', () => {
      const run = RunResultStub();

      const result = caseRunStatusTransformer({
        run,
        testCase: CaseResultStub({
          testCase: { reachesExit: 'grade/return@then', arrange: [{ param: 'score', value: 99 }] },
        }).testCase,
      });

      expect(String(result)).toBe('not-run');
    });

    it('EMPTY: {no run at all} => not-run', () => {
      const result = caseRunStatusTransformer({ run: undefined, testCase: CaseResultStub().testCase });

      expect(String(result)).toBe('not-run');
    });
  });
});
