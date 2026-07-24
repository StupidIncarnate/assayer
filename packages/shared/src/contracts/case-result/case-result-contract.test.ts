import { caseResultContract } from './case-result-contract';
import { CaseResultStub } from './case-result.stub';

describe('caseResultContract', () => {
  describe('valid case results', () => {
    it('VALID: {stub default} => parses a passing case with its trace', () => {
      expect(caseResultContract.parse(CaseResultStub())).toStrictEqual({
        entryName: 'grade',
        testCase: {
          reachesPath: ['grade/return@then'],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 2 },
          ],
          salient: true,
        },
        status: 'passed',
        observedPath: ['grade/return@then'],
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
      expect(CaseResultStub({ status: 'failed', observedPath: ['grade/return@else'] })).toStrictEqual({
        entryName: 'grade',
        testCase: {
          reachesPath: ['grade/return@then'],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 2 },
          ],
          salient: true,
        },
        status: 'failed',
        observedPath: ['grade/return@else'],
        trace: [
          { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/if:x#leaf.1', kind: 'cond', outcome: true, valueText: 'true' },
          { id: 'grade/return@then', kind: 'exit', valueText: "'pass'" },
        ],
      });
    });

    // The OTHER non-pass, and a different fact about the world: no verdict about the prediction was
    // produced at all. Its observedPath is necessarily empty — it reached no exit — which is why a
    // reader must not read it as "came out here instead", and why the message carries the finding.
    it('VALID: {reached no exit at all} => parses as errored, with an empty observed path and a message', () => {
      expect(
        CaseResultStub({
          status: 'errored',
          observedPath: [],
          trace: [],
          message: 'threw before reaching an exit: items.map is not a function',
        }),
      ).toStrictEqual({
        entryName: 'grade',
        testCase: {
          reachesPath: ['grade/return@then'],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 2 },
          ],
          salient: true,
        },
        status: 'errored',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: items.map is not a function',
      });
    });
  });

  describe('invalid case results', () => {
    it('INVALID: {status: "skipped"} => throws, since a generated case has no representable skip', () => {
      expect(() => {
        return caseResultContract.parse({
          entryName: 'grade',
          testCase: { reachesPath: ['x'], arrange: [] },
          status: 'skipped',
          trace: [],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
