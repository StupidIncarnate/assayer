import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { CaseResultStub } from '@assayer/shared/contracts/case-result/case-result.stub';
import { DerivedTestCaseStub } from '@assayer/shared/contracts/derived-test-case/derived-test-case.stub';

import { caseRunResultTransformer } from './case-run-result-transformer';

describe('caseRunResultTransformer', () => {
  describe('a case the run covered', () => {
    // The WHOLE result, not a status: the panel needs the message to say why a case did not pass, and
    // a transformer that answered only "failed" is what forced that reason to live in the run console.
    it('VALID: {a case the run holds} => the whole result, message included', () => {
      const errored = CaseResultStub({
        status: 'errored',
        observedPath: [],
        message: 'threw before reaching an exit: items.map is not a function',
      });

      const result = caseRunResultTransformer({ run: RunResultStub({ cases: [errored] }), testCase: errored.testCase });

      expect(result).toStrictEqual(errored);
    });

    // fewestRuns, driven and arms are not identity: a stale blob still matches a run
    // whose case carries the same exit and arrange, so a query differing ONLY in them resolves.
    it('VALID: {run case and query differing only in arms, same exit+arrange} => matches, ignoring arms', () => {
      const stored = CaseResultStub({ testCase: DerivedTestCaseStub({ arms: [] }) });

      const result = caseRunResultTransformer({
        run: RunResultStub({ cases: [stored] }),
        testCase: DerivedTestCaseStub({ arms: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }] }),
      });

      expect(result).toStrictEqual(stored);
    });
  });

  describe('a case the run did not cover', () => {
    // Matched on the case's own identity, never position: the derived cases come from the analysis
    // blob and the results from an artifact that may be older, so an index would attribute the wrong
    // verdict — and now the wrong MESSAGE — the moment either list changed.
    it('VALID: {a different arrange} => undefined rather than the neighbour result', () => {
      const result = caseRunResultTransformer({
        run: RunResultStub(),
        testCase: CaseResultStub({
          testCase: { reachesPath: ['grade/return@then'], arrange: [{ kind: 'param', param: 'score', value: 99 }] },
        }).testCase,
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a different predicted exit, same arrange} => undefined', () => {
      const result = caseRunResultTransformer({
        run: RunResultStub(),
        testCase: CaseResultStub({
          testCase: {
            reachesPath: ['grade/return@else'],
            arrange: [
              { kind: 'param', param: 'score', value: 6 },
              { kind: 'param', param: 'bonus', value: 2 },
            ],
          },
        }).testCase,
      });

      expect(result).toBe(undefined);
    });

    // Only the run set is executed. An undriven case or one outside the fewest-runs set is listed and
    // never run, so even a run result sharing its exit and arrange is not its result.
    it('VALID: {undriven case sharing exit and arrange with a run case} => undefined, it is never run', () => {
      const stored = CaseResultStub();

      const result = caseRunResultTransformer({
        run: RunResultStub({ cases: [stored] }),
        testCase: DerivedTestCaseStub({ ...stored.testCase, driven: false }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {case outside the fewest-runs set sharing exit and arrange} => undefined, it is never run', () => {
      const stored = CaseResultStub();

      const result = caseRunResultTransformer({
        run: RunResultStub({ cases: [stored] }),
        testCase: DerivedTestCaseStub({ ...stored.testCase, fewestRuns: false }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {no run at all} => undefined', () => {
      const result = caseRunResultTransformer({ run: undefined, testCase: CaseResultStub().testCase });

      expect(result).toBe(undefined);
    });
  });
});
