import { RunResultStub, CaseResultStub } from '@assayer/shared/contracts';

import { runDetailFormatTransformer } from './run-detail-format-transformer';

describe('runDetailFormatTransformer', () => {
  describe('a passing run', () => {
    it('VALID: {a case with a full trace} => the path, each leaf outcome, and the exit', () => {
      const result = runDetailFormatTransformer({ run: RunResultStub() });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/boolean/and.ts  run r-1784093000000\n' +
          '  PASSED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          "    cond  grade/if:x#leaf.0 true  true\n" +
          "    cond  grade/if:x#leaf.1 true  true\n" +
          "    exit  grade/return@then  'pass'",
      );
    });
  });

  describe('a short-circuited case', () => {
    // The unevaluated leaf has NO event and gets NO line. Absent is not false — it is "the language
    // never evaluated this" — and inventing a line for it would throw the distinction away.
    it('VALID: {only the deciding leaf fired} => the other leaf is absent, not rendered false', () => {
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            trace: [
              { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: false, valueText: 'false' },
              { id: 'grade/return@else', kind: 'exit', valueText: "'fail'" },
            ],
          }),
        ],
      });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/boolean/and.ts  run r-1784093000000\n' +
          '  PASSED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 false  false\n' +
          "    exit  grade/return@else  'fail'",
      );
    });
  });

  describe('gaps', () => {
    it('VALID: {a gap} => reported alongside the trace', () => {
      const run = RunResultStub({ cases: [], gaps: [{ name: 'find', reason: 'needs a harness' }] });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/boolean/and.ts  run r-1784093000000\n  GAP  find — needs a harness',
      );
    });
  });
});
