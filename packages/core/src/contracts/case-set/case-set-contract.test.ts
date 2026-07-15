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
            exitIds: ['grade/return@then', 'grade/return@else'],
            cases: [
              {
                reachesExit: 'grade/return@then',
                arrange: [
                  { param: 'score', value: 6 },
                  { param: 'bonus', value: 2 },
                ],
              },
            ],
          },
        ],
      });
    });

    // A file whose entries are all uncallable (a bare module scope, a default export) assembles to an
    // empty set rather than to nothing: "analyzed, nothing runnable" must stay sayable.
    it('EMPTY: {no entries} => parses', () => {
      expect(CaseSetStub({ entries: [] }).entries).toStrictEqual([]);
    });
  });

  describe('invalid case sets', () => {
    it('INVALID: {no modulePath} => throws, since an entry that cannot be required cannot be driven', () => {
      expect(() => {
        return caseSetContract.parse({ relPath: 'src/f.ts', entries: [] });
      }).toThrow(/Required/u);
    });
  });
});
