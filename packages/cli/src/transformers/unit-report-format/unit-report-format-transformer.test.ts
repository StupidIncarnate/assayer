import { RunResultStub, CaseResultStub } from '@assayer/shared/contracts';

import { unitReportFormatTransformer } from './unit-report-format-transformer';

describe('unitReportFormatTransformer', () => {
  describe('a run where everything passed', () => {
    it('VALID: {all cases passed} => one line per file, no noise', () => {
      const result = unitReportFormatTransformer({ runs: [RunResultStub()] });

      expect(String(result)).toBe('packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed');
    });
  });

  describe('a run with a failure', () => {
    // The arrange and both exits, because "L3 != L6" is unreadable: the reader needs the values that
    // drove it and the claim that broke, not two line numbers.
    it('VALID: {a failing case} => the arrange, the predicted exit, and what happened', () => {
      const runs = [
        RunResultStub({
          cases: [
            CaseResultStub(),
            CaseResultStub({
              status: 'failed',
              observedExit: 'grade/return@else',
              testCase: { reachesExit: 'grade/return@then', arrange: [{ kind: 'param', param: 'score', value: 6 }] },
            }),
          ],
        }),
      ];

      const result = unitReportFormatTransformer({ runs });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/2 passed\n' +
          '  FAIL grade(6)\n' +
          '    predicted grade/return@then\n' +
          '    reached grade/return@else\n' +
          '  assayer detail r-1784093000000',
      );
    });

    // A case that threw reached NO exit, so there is no observed id to print — the throw is the
    // finding, and it is what the reader needs told.
    it('VALID: {a case that threw} => its message rather than an exit id', () => {
      const runs = [
        RunResultStub({
          cases: [CaseResultStub({ status: 'failed', message: 'threw before reaching an exit: boom' })],
        }),
      ];

      const result = unitReportFormatTransformer({ runs });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  0/1 passed\n' +
          '  FAIL grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    threw before reaching an exit: boom\n' +
          '  assayer detail r-1784093000000',
      );
    });

    // A backstop that takes more than one step to reach stops being used.
    it('VALID: {a failing case} => ends with the command that shows the whole trace', () => {
      const runs = [
        RunResultStub({
          runId: 'abc123',
          cases: [CaseResultStub({ status: 'failed', message: 'reached no exit in grade' })],
        }),
      ];

      const result = unitReportFormatTransformer({ runs });

      expect(String(result).endsWith('  assayer detail abc123')).toBe(true);
    });
  });

  describe('gaps', () => {
    // Printed even when everything passed: a run that reports only its passes reads as complete
    // coverage of the file.
    it('VALID: {a gap on a passing run} => still reported', () => {
      const runs = [RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] })];

      const result = unitReportFormatTransformer({ runs });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n  GAP  find — needs a harness',
      );
    });
  });

  describe('a run with no cases', () => {
    // A file whose entries derive nothing still reports its header rather than vanishing: "analyzed,
    // nothing runnable" is an answer, and silence would read as "not analyzed".
    it('EMPTY: {a file that derived no cases} => its header, with the count honest', () => {
      const result = unitReportFormatTransformer({ runs: [RunResultStub({ cases: [] })] });

      expect(String(result)).toBe('packages/syntax-repository/src/happy-path/boolean/and/and.ts  0/0 passed');
    });
  });

  describe('undriven logic', () => {
    // Without this line the report above is the WHOLE report for a file of pure module-scope
    // branching — `0/0 passed`, which is exactly what an empty file prints.
    it('VALID: {a file whose only logic is undriven} => named by its LABEL, not the internal *module*, beside the honest 0/0', () => {
      const runs = [
        RunResultStub({
          cases: [],
          undriven: [
            {
              name: '*module*',
              label: 'welded-const.ts',
              reason: 'it runs at import time, so no case drove its branches',
              startLine: 1,
              endLine: 8,
            },
          ],
        }),
      ];

      const result = unitReportFormatTransformer({ runs });

      // The report shows the module's label (its file basename here), never the internal *module* —
      // exactly what the desktop panel shows, so the two describe one artifact identically.
      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  0/0 passed\n' +
          '  UNDRIVEN welded-const.ts — it runs at import time, so no case drove its branches',
      );
    });

    // Three channels, three debts — a gap is the reader's to close, a dark spot is Assayer's blind
    // spot, and this is Assayer's reach. Merging any two would tell the reader the wrong thing to do.
    it('VALID: {a gap and an undriven entry} => separate lines, never merged', () => {
      const runs = [
        RunResultStub({
          gaps: [{ name: 'find', reason: 'needs a harness' }],
          undriven: [{ name: 'inner', reason: 'it is not exported', startLine: 2, endLine: 8 }],
        }),
      ];

      const result = unitReportFormatTransformer({ runs });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  GAP  find — needs a harness\n' +
          '  UNDRIVEN inner — it is not exported',
      );
    });
  });
});
