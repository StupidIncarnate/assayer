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
    it('INVALID: {no harnessHash} => throws validation error', () => {
      expect(() => {
        return harnessIndexContract.parse({ layoutHash: EMPTY_HASH, tsconfigHash: EMPTY_HASH, harnesses: [] });
      }).toThrow(/Required/u);
    });
  });
});
