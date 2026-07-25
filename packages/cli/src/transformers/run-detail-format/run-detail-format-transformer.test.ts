import { RunResultStub, CaseResultStub } from '@assayer/shared/contracts';

import { runDetailFormatTransformer } from './run-detail-format-transformer';

describe('runDetailFormatTransformer', () => {
  describe('a passing run', () => {
    it('VALID: {a case with a full trace} => the path, each leaf outcome, and the exit', () => {
      const result = runDetailFormatTransformer({ run: RunResultStub() });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
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
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
          '  PASSED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 false  false\n' +
          "    exit  grade/return@else  'fail'",
      );
    });
  });

  describe('an errored case', () => {
    // ERROR, not ERRORED. The marker is product surface shared with `assayer unit`, and two spellings
    // of one outcome is two vocabularies for the reader to learn. The trace it DID get to still
    // renders — a case that threw halfway through has evidence worth reading.
    it('VALID: {a case that threw} => the ERROR marker and the partial trace it reached', () => {
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'errored',
            observedPath: [],
            message: 'threw before reaching an exit: items.map is not a function',
            trace: [{ id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' }],
          }),
        ],
      });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
          '  ERROR grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 true  true',
      );
    });

    // A throw before ANY probe fired leaves the trace empty — the predicted line still renders, and no
    // event lines follow it. Distinct from the case above, whose trace has one entry.
    it('VALID: {a case that threw before any probe fired} => the ERROR marker with no event lines', () => {
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'errored',
            observedPath: [],
            message: 'threw before reaching an exit: items.map is not a function',
            trace: [],
          }),
        ],
      });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
          '  ERROR grade(6, 2)\n' +
          '    predicted grade/return@then',
      );
    });
  });

  describe('a failed case', () => {
    // FAILED, uppercased from its own status — the same rule PASSED follows, and the only marker of
    // the three that is not a special-cased spelling.
    it('VALID: {a case that reached the wrong exit} => the FAILED marker and its trace', () => {
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'failed',
            observedPath: ['grade/return@else'],
            trace: [
              { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: false, valueText: 'false' },
              { id: 'grade/return@else', kind: 'exit', valueText: "'fail'" },
            ],
          }),
        ],
      });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
          '  FAILED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 false  false\n' +
          "    exit  grade/return@else  'fail'",
      );
    });
  });

  describe('multiple cases in one run', () => {
    // Two cases in one run share ONE header — the flatMap boundary between them is invisible in the
    // text, so cases print back to back rather than each restating the file/run line.
    it('VALID: {two cases, one passed and one errored} => both traces render under the shared header', () => {
      const run = RunResultStub({
        cases: [
          CaseResultStub(),
          CaseResultStub({
            status: 'errored',
            observedPath: [],
            message: 'threw before reaching an exit: boom',
            trace: [{ id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' }],
          }),
        ],
      });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n' +
          '  PASSED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          "    cond  grade/if:x#leaf.0 true  true\n" +
          "    cond  grade/if:x#leaf.1 true  true\n" +
          "    exit  grade/return@then  'pass'\n" +
          '  ERROR grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 true  true',
      );
    });
  });

  describe('gaps', () => {
    it('VALID: {a gap} => reported alongside the trace', () => {
      const run = RunResultStub({ cases: [], gaps: [{ name: 'find', reason: 'needs a harness' }] });

      const result = runDetailFormatTransformer({ run });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  run r-1784093000000\n  GAP find — needs a harness',
      );
    });
  });
});
