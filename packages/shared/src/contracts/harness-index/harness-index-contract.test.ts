import { harnessIndexContract } from './harness-index-contract';
import { HarnessIndexStub } from './harness-index.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const OTHER_HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('harnessIndexContract', () => {
  describe('valid harness indexes', () => {
    it('VALID: {stub default} => carries the three hashes and the harness files', () => {
      const result = harnessIndexContract.parse(HarnessIndexStub());

      expect(result).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [
          { relPath: 'src/audit.harness.ts', targetRelPath: 'src/audit.ts', keys: [{ entry: 'audit', param: 'report' }] },
        ],
      });
    });

    it('EMPTY: {no harness files} => parses an empty inventory', () => {
      const result = harnessIndexContract.parse(HarnessIndexStub({ harnesses: [] }));

      expect(result).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [],
      });
    });

    it('VALID: {a harness-only edit} => moves harnessHash while layout and tsconfig hashes stay', () => {
      const result = harnessIndexContract.parse(HarnessIndexStub({ harnessHash: OTHER_HASH }));

      expect(result).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: OTHER_HASH,
        harnesses: [
          { relPath: 'src/audit.harness.ts', targetRelPath: 'src/audit.ts', keys: [{ entry: 'audit', param: 'report' }] },
        ],
      });
    });
  });

  describe('invalid harness indexes', () => {
    // Every field is required — an omitted hash reads as an unmoved cache key, and an omitted
    // harnesses array reads as an empty inventory rather than an unparsed one. Derived from the
    // contract's own shape rather than a hand-typed list, so a field added later is covered with no
    // edit here.
    const REQUIRED_FIELDS = Object.keys(harnessIndexContract.shape);

    it.each(REQUIRED_FIELDS)('INVALID: {missing %s} => throws validation error', (field) => {
      const entries = Object.entries(HarnessIndexStub()).filter(([key]) => key !== field);

      expect(() => harnessIndexContract.parse(Object.fromEntries(entries))).toThrow(/Required/u);
    });

    it('INVALID: {layoutHash: "not-a-hash"} => throws validation error', () => {
      expect(() => {
        return harnessIndexContract.parse({
          layoutHash: 'not-a-hash',
          tsconfigHash: EMPTY_HASH,
          harnessHash: EMPTY_HASH,
          harnesses: [],
        });
      }).toThrow(/Invalid/u);
    });
  });
});
