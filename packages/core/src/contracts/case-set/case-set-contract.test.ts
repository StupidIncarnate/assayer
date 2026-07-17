import { caseSetContract } from './case-set-contract';
import { CaseSetStub } from './case-set.stub';

describe('caseSetContract', () => {
  describe('valid case sets', () => {
    it('VALID: {stub default} => parses the entry with its own exit ids and cases', () => {
      expect(caseSetContract.parse(CaseSetStub())).toStrictEqual({
        relPath: 'src/boolean/and.ts',
        modulePath: '/abs/src/boolean/and.ts',
        entries: [
          {
            name: 'grade',
            access: { kind: 'named' },
            exitIds: ['grade/return@then', 'grade/return@else'],
            cases: [
              {
                reachesExit: 'grade/return@then',
                arrange: [
                  { kind: 'param', param: 'score', value: 6 },
                  { kind: 'param', param: 'bonus', value: 2 },
                ],
              },
            ],
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
      });
    });

    // A file whose entries are all uncallable (a bare module scope, a nested helper) assembles to an
    // empty set rather than to nothing: "analyzed, nothing runnable" must stay sayable.
    it('EMPTY: {no entries} => parses', () => {
      expect(CaseSetStub({ entries: [] }).entries).toStrictEqual([]);
    });

    // The pairing that makes an empty set MEAN something. Entries and undriven both empty is "there
    // was nothing here"; empty entries beside a named undriven entry is "there is logic here and
    // nothing drove it" — and the runner reads exactly this to decide there is nothing for Jest.
    it('EMPTY: {no entries, one undriven} => parses, carrying why there is nothing to drive', () => {
      const set = CaseSetStub({
        entries: [],
        undriven: [
          {
            name: '*module*',
            reason: 'it runs at import time, so no case drove its branches',
            startLine: 1,
            endLine: 8,
          },
        ],
      });

      expect({ entries: set.entries, undriven: set.undriven }).toStrictEqual({
        entries: [],
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

    // Required, not optional, for the reason darkSpots is: a set that can omit what it could not
    // drive reads as complete coverage of the file.
    it('INVALID: {no gaps} => throws, since an omitted gap reads as full coverage', () => {
      expect(() => {
        return caseSetContract.parse({ relPath: 'src/f.ts', modulePath: '/abs/f.ts', entries: [] });
      }).toThrow(/Required/u);
    });
  });

  describe('invalid case sets', () => {
    it('INVALID: {no modulePath} => throws, since an entry that cannot be required cannot be driven', () => {
      expect(() => {
        return caseSetContract.parse({ relPath: 'src/f.ts', entries: [], gaps: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID: {an entry with no access} => throws, since it could only be driven by guessing', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [{ name: 'grade', exitIds: [], cases: [] }],
          gaps: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
