import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { CaseResultStub } from '@assayer/shared/contracts/case-result/case-result.stub';
import { DerivedTestCaseStub } from '@assayer/shared/contracts/derived-test-case/derived-test-case.stub';

import { caseRunStatusTransformer } from './case-run-status-transformer';

describe('caseRunStatusTransformer', () => {
  describe('a case the run covered', () => {
    it('VALID: {a passing case} => passed', () => {
      const run = RunResultStub();

      const result = caseRunStatusTransformer({ run, testCase: CaseResultStub().testCase });

      expect(result).toBe('passed');
    });

    it('VALID: {a failing case} => failed', () => {
      const run = RunResultStub({ cases: [CaseResultStub({ status: 'failed' })] });

      const result = caseRunStatusTransformer({ run, testCase: CaseResultStub().testCase });

      expect(result).toBe('failed');
    });

    // Passed THROUGH, not mapped: the artifact already distinguishes a case that reached the wrong
    // exit from one that reached none, and collapsing errored into failed here would re-decide a run
    // this transformer did not watch.
    it('VALID: {an errored case} => errored rather than failed', () => {
      const run = RunResultStub({ cases: [CaseResultStub({ status: 'errored', observedPath: [] })] });

      const result = caseRunStatusTransformer({ run, testCase: CaseResultStub().testCase });

      expect(result).toBe('errored');
    });

    // salient is a must-run display opinion, not identity: an all-salient blob still matches a run
    // whose case carries the same exit and arrange, so a query differing ONLY in salient resolves.
    it('VALID: {run case salient, query not-salient, same exit+arrange} => matches, ignoring salient', () => {
      const run = RunResultStub({ cases: [CaseResultStub({ testCase: DerivedTestCaseStub({ salient: true }) })] });

      const result = caseRunStatusTransformer({ run, testCase: DerivedTestCaseStub({ salient: false }) });

      expect(result).toBe('passed');
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
          testCase: { reachesPath: ['grade/return@then'], arrange: [{ kind: 'param', param: 'score', value: 99 }] },
        }).testCase,
      });

      expect(result).toBe('not-run');
    });

    it('EMPTY: {no run at all} => not-run', () => {
      const result = caseRunStatusTransformer({ run: undefined, testCase: CaseResultStub().testCase });

      expect(result).toBe('not-run');
    });
  });
});
