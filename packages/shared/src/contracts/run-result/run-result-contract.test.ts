import { runResultContract } from './run-result-contract';
import { RunResultStub } from './run-result.stub';

describe('runResultContract', () => {
  describe('valid runs', () => {
    it('VALID: {stub default} => parses the run with its one passing case', () => {
      const run = RunResultStub();

      expect(runResultContract.parse(run)).toStrictEqual({
        runId: 'r-1784093000000',
        relPath: 'packages/syntax-repository/src/boolean/and.ts',
        cases: [
          {
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
          },
        ],
        gaps: [],
      });
    });

    // Carried on the run, not left in the cache: a gap is Assayer telling a HUMAN what it could not
    // drive, and a run reporting only its passes reads as complete coverage of the file.
    it('VALID: {a run with a gap} => the gap parses with its reason', () => {
      const run = RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] });

      expect(run.gaps).toStrictEqual([{ name: 'find', reason: 'needs a harness' }]);
    });

    // A run that reached NO exit is a real outcome, not a malformed record: the entry threw, or could
    // not be driven. Omitting observedExit says that, where a wrong exit would say something else.
    it('EDGE: {a failed case that reached no exit} => parses without observedExit', () => {
      const run = RunResultStub({
        cases: [
          {
            entryName: 'grade',
            testCase: { reachesExit: 'grade/return@then', arrange: [] },
            status: 'failed',
            trace: [],
            message: 'reached no exit in grade',
          },
        ],
      });

      expect(run.cases).toStrictEqual([
        {
          entryName: 'grade',
          testCase: { reachesExit: 'grade/return@then', arrange: [] },
          status: 'failed',
          trace: [],
          message: 'reached no exit in grade',
        },
      ]);
    });
  });

  describe('invalid runs', () => {
    it('INVALID: {no runId} => throws validation error', () => {
      expect(() => {
        return runResultContract.parse({ relPath: 'src/f.ts', cases: [], gaps: [] });
      }).toThrow(/Required/u);
    });

    // Required for the reason darkSpots is: a run that can omit what it could not drive reads as
    // complete coverage.
    it('INVALID: {no gaps} => throws, since an omitted gap reads as full coverage', () => {
      expect(() => {
        return runResultContract.parse({ runId: 'r1', relPath: 'src/f.ts', cases: [] });
      }).toThrow(/Required/u);
    });
  });
});
