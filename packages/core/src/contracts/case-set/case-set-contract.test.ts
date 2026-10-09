import { caseSetContract } from './case-set-contract';
import { CaseSetStub } from './case-set.stub';

describe('caseSetContract', () => {
  describe('valid case sets', () => {
    it('VALID: {stub default} => parses the entry with its own exit ids and cases', () => {
      expect(caseSetContract.parse(CaseSetStub())).toStrictEqual({
        relPath: 'src/happy-path/boolean/and/and.ts',
        modulePath: '/abs/src/happy-path/boolean/and/and.ts',
        entries: [
          {
            name: 'grade',
            access: { kind: 'named' },
            exitIds: ['grade/return@then', 'grade/return@else'],
            cases: [
              {
                reachesPath: ['grade/return@then'],
                arrange: [
                  { kind: 'param', param: 'score', value: 6 },
                  { kind: 'param', param: 'bonus', value: 2 },
                ],
                salient: true,
              },
            ],
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
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

    // `harnessPath` is present exactly when some case names a harness binding — the shim's
    // instruction to REQUIRE that colocated file so it can resolve the harness's keys live.
    it('VALID: {harnessPath} => carries the absolute path the shim requires the harness through', () => {
      const set = CaseSetStub({ harnessPath: '/abs/src/happy-path/boolean/and/and.harness.ts' });

      expect(caseSetContract.parse(set)).toStrictEqual({
        relPath: 'src/happy-path/boolean/and/and.ts',
        modulePath: '/abs/src/happy-path/boolean/and/and.ts',
        harnessPath: '/abs/src/happy-path/boolean/and/and.harness.ts',
        entries: [
          {
            name: 'grade',
            access: { kind: 'named' },
            exitIds: ['grade/return@then', 'grade/return@else'],
            cases: [
              {
                reachesPath: ['grade/return@then'],
                arrange: [
                  { kind: 'param', param: 'score', value: 6 },
                  { kind: 'param', param: 'bonus', value: 2 },
                ],
                salient: true,
              },
            ],
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
      });
    });
  });

  describe('an instance method of a class that needs constructor arguments', () => {
    it('VALID: {an entry with construct bindings} => parses, carrying the bindings the instance is built from', () => {
      const set = CaseSetStub({
        entries: [
          {
            name: 'find',
            access: { kind: 'method', className: 'Repo', constructable: false },
            exitIds: ['find/return@if-then'],
            cases: [{ reachesPath: ['find/return@if-then'], arrange: [{ kind: 'param', param: 'id', value: 1 }], salient: true }],
            construct: [{ kind: 'param', param: 'url', value: 'abc123' }],
          },
        ],
      });

      expect(caseSetContract.parse(set).entries).toStrictEqual([
        {
          name: 'find',
          access: { kind: 'method', className: 'Repo', constructable: false },
          exitIds: ['find/return@if-then'],
          cases: [{ reachesPath: ['find/return@if-then'], arrange: [{ kind: 'param', param: 'id', value: 1 }], salient: true }],
          construct: [{ kind: 'param', param: 'url', value: 'abc123' }],
        },
      ]);
    });

    it('INVALID: {a construct binding of an unknown kind} => throws', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [
            {
              name: 'find',
              access: { kind: 'method', className: 'Repo', constructable: false },
              exitIds: [],
              cases: [],
              construct: [{ kind: 'nope' }],
            },
          ],
          gaps: [],
          darkSpots: [],
          undriven: [],
          lints: [],
        });
      }).toThrow(/Invalid discriminator value/u);
    });
  });

  describe('invalid case sets', () => {
    it('INVALID: {no modulePath} => throws, since an entry that cannot be required cannot be driven', () => {
      expect(() => {
        return caseSetContract.parse({ relPath: 'src/f.ts', entries: [], gaps: [] });
      }).toThrow(/Invalid input: expected string, received undefined/u);
    });

    it('INVALID: {no relPath} => throws, since a case set with no source it applies to cannot be filed', () => {
      expect(() => {
        return caseSetContract.parse({
          modulePath: '/abs/f.ts',
          entries: [],
          gaps: [],
          darkSpots: [],
          undriven: [],
          lints: [],
        });
      }).toThrow(/Invalid input: expected string, received undefined/u);
    });

    it('INVALID: {entries key missing} => throws, since an omitted entries list is not the same as an empty one', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          gaps: [],
          darkSpots: [],
          undriven: [],
          lints: [],
        });
      }).toThrow(/Invalid input: expected array, received undefined/u);
    });

    it('INVALID: {an entry with no access} => throws, since it could only be driven by guessing', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [{ name: 'grade', exitIds: [], cases: [] }],
          gaps: [],
        });
      }).toThrow(/Invalid input: expected object, received undefined/u);
    });

    // Required, not optional, for the reason darkSpots is: a set that can omit what it could not
    // drive reads as complete coverage of the file.
    it('INVALID: {no gaps} => throws, since an omitted gap reads as full coverage', () => {
      expect(() => {
        return caseSetContract.parse({ relPath: 'src/f.ts', modulePath: '/abs/f.ts', entries: [] });
      }).toThrow(/Invalid input: expected array, received undefined/u);
    });

    // Required for the same reason gaps is: a dark spot Assayer never understood is a different
    // debt than a gap the caller owes, and an omittable channel would let it read as understood.
    it('INVALID: {no darkSpots} => throws, since an omitted dark spot reads as full understanding', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [],
          gaps: [],
          undriven: [],
          lints: [],
        });
      }).toThrow(/Invalid input: expected array, received undefined/u);
    });

    it('INVALID: {no undriven} => throws, since an empty entries list needs this channel to mean anything', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [],
          gaps: [],
          darkSpots: [],
          lints: [],
        });
      }).toThrow(/Invalid input: expected array, received undefined/u);
    });

    it('INVALID: {no lints} => throws, since an omitted lint reads as a repo with nothing to fix', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          entries: [],
          gaps: [],
          darkSpots: [],
          undriven: [],
        });
      }).toThrow(/Invalid input: expected array, received undefined/u);
    });

    it('INVALID: {harnessPath: ""} => throws too_small', () => {
      expect(() => {
        return caseSetContract.parse({
          relPath: 'src/f.ts',
          modulePath: '/abs/f.ts',
          harnessPath: '',
          entries: [],
          gaps: [],
          darkSpots: [],
          undriven: [],
          lints: [],
        });
      }).toThrow(/too_small/u);
    });
  });
});
