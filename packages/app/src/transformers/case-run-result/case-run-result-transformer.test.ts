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

    // salient is a must-run display opinion, not identity: an all-salient blob still matches a run
    // whose case carries the same exit and arrange, so a query differing ONLY in salient resolves.
    it('VALID: {run case salient, query not-salient, same exit+arrange} => matches, ignoring salient', () => {
      const stored = CaseResultStub({ testCase: DerivedTestCaseStub({ salient: true }) });

      const result = caseRunResultTransformer({
        run: RunResultStub({ cases: [stored] }),
        testCase: DerivedTestCaseStub({ salient: false }),
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

    it('EMPTY: {no run at all} => undefined', () => {
      const result = caseRunResultTransformer({ run: undefined, testCase: CaseResultStub().testCase });

      expect(result).toBe(undefined);
    });
  });
});
