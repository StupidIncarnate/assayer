import { DarkSpotStub } from '../dark-spot/dark-spot.stub';
import { LintEntryStub } from '../lint-entry/lint-entry.stub';
import { runResultContract } from './run-result-contract';
import { RunResultStub } from './run-result.stub';

describe('runResultContract', () => {
  describe('valid runs', () => {
    it('VALID: {stub default} => parses the run with its one passing case', () => {
      const run = RunResultStub();

      expect(runResultContract.parse(run)).toStrictEqual({
        runId: 'r-1784093000000',
        relPath: 'packages/syntax-repository/src/happy-path/boolean/and/and.ts',
        cases: [
          {
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
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
      });
    });

    // Carried on the run, not left in the cache: a gap is Assayer telling a HUMAN what it could not
    // drive, and a run reporting only its passes reads as complete coverage of the file.
    it('VALID: {a run with a gap} => the gap parses with its reason', () => {
      const run = RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] });

      expect(run.gaps).toStrictEqual([{ name: 'find', reason: 'needs a harness' }]);
    });

    // The dark spot channel is a DIFFERENT admission from a gap — Assayer's debt, not the caller's —
    // and reports on its own line rather than folding into gaps.
    it('VALID: {a run with a dark spot} => the dark spot parses with its reason', () => {
      const run = RunResultStub({ darkSpots: [DarkSpotStub()] });

      expect(run.darkSpots).toStrictEqual([
        { kind: 'ForStatement', scopePath: ['sumAll'], reason: 'unhandled-syntax', startLine: 3, endLine: 5 },
      ]);
    });

    // The fourth channel, beside gaps/darkSpots/undriven — a lint says "this should not be here",
    // never "Assayer cannot drive this".
    it('VALID: {a run with a lint} => the lint parses with its rule and message', () => {
      const run = RunResultStub({ lints: [LintEntryStub()] });

      expect(run.lints).toStrictEqual([
        {
          rule: 'dead-surface',
          name: 'decide',
          message: 'nothing in this file calls it, so it is dead surface',
          startLine: 1,
          endLine: 7,
        },
      ]);
    });

    // A run with NO cases and no gaps is the shape this channel exists for: without it, a file whose
    // only logic is a module-scope `if` reports exactly what a fully-covered file reports.
    it('VALID: {a run whose only logic is undriven} => zero cases, and the reason why', () => {
      const run = RunResultStub({
        cases: [],
        undriven: [
          {
            name: '*module*',
            reason: 'it runs at import time, so no case drove its branches',
            startLine: 1,
            endLine: 8,
          },
        ],
      });

      expect({ cases: run.cases, gaps: run.gaps, darkSpots: run.darkSpots, undriven: run.undriven }).toStrictEqual({
        cases: [],
        gaps: [],
        darkSpots: [],
        undriven: [
          {
            name: '*module*',
            reason: 'it runs at import time, so no case drove its branches',
            startLine: 1,
            endLine: 8,
          },
        ],
      });
    });

    // A run that reached NO exit is a real outcome, not a malformed record: the entry threw, or could
    // not be driven. An empty observedPath says that, where a wrong exit would say something else.
    it('EDGE: {a failed case that reached no exit} => parses with an empty observed path', () => {
      const run = RunResultStub({
        cases: [
          {
            entryName: 'grade',
            testCase: { reachesPath: ['grade/return@then'], arrange: [], salient: true },
            status: 'failed',
            observedPath: [],
            trace: [],
            message: 'reached no exit in grade',
          },
        ],
      });

      expect(run.cases).toStrictEqual([
        {
          entryName: 'grade',
          testCase: { reachesPath: ['grade/return@then'], arrange: [], salient: true },
          status: 'failed',
          observedPath: [],
          trace: [],
          message: 'reached no exit in grade',
        },
      ]);
    });
  });

  describe('invalid runs', () => {
    // Every channel is required, never optional — a run that can omit a gap, a dark spot, an
    // undriven admission, or a lint reads as complete coverage of the file, which is exactly the lie
    // those channels exist to prevent. Derived from the contract's own shape rather than a
    // hand-typed list, so a field added later is covered with no edit here.
    const REQUIRED_FIELDS = Object.keys(runResultContract.shape);

    it.each(REQUIRED_FIELDS)('INVALID: {missing %s} => throws validation error', (field) => {
      const entries = Object.entries(RunResultStub()).filter(([key]) => key !== field);

      expect(() => runResultContract.parse(Object.fromEntries(entries))).toThrow(/Required/u);
    });
  });
});
