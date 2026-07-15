import { caseResultContract } from './case-result-contract';
import { CaseResultStub } from './case-result.stub';

describe('caseResultContract', () => {
  describe('valid case results', () => {
    it('VALID: {stub default} => parses a passing case with its trace', () => {
      expect(caseResultContract.parse(CaseResultStub())).toStrictEqual({
        entryName: 'grade',
        testCase: {
          reachesExit: 'grade/return@then',
          arrange: [
            { param: 'score', value: 6 },
            { param: 'bonus', value: 2 },
          ],
        },
        status: 'passed',
        observedExit: 'grade/return@then',
        trace: [
          { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/if:x#leaf.1', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/return@then', kind: 'exit', valueText: "'pass'" },
        ],
      });
    });

    // The failure that matters: the derived values drove the flow somewhere the analyzer did not
    // predict. Both exits are recorded so the report can say expected-vs-observed rather than "no".
    it('VALID: {reached the wrong exit} => parses with both the predicted and the observed exit', () => {
      expect(CaseResultStub({ status: 'failed', observedExit: 'grade/return@else' })).toStrictEqual({
        entryName: 'grade',
        testCase: {
          reachesExit: 'grade/return@then',
          arrange: [
            { param: 'score', value: 6 },
            { param: 'bonus', value: 2 },
          ],
        },
        status: 'failed',
        observedExit: 'grade/return@else',
        trace: [
          { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/if:x#leaf.1', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/return@then', kind: 'exit', valueText: "'pass'" },
        ],
      });
    });
  });

  describe('invalid case results', () => {
    it('INVALID: {status: "skipped"} => throws, since a generated case has no representable skip', () => {
      expect(() => {
        return caseResultContract.parse({
          entryName: 'grade',
          testCase: { reachesExit: 'x', arrange: [] },
          status: 'skipped',
          trace: [],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
