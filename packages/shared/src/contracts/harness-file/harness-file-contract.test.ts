import { harnessFileContract } from './harness-file-contract';
import { HarnessFileStub } from './harness-file.stub';

describe('harnessFileContract', () => {
  describe('valid harness files', () => {
    it('VALID: {stub default} => carries its own path, its target, and its declared keys', () => {
      const result = harnessFileContract.parse(HarnessFileStub());

      expect(result).toStrictEqual({
        relPath: 'src/audit.harness.ts',
        targetRelPath: 'src/audit.ts',
        keys: [{ entry: 'audit', param: 'report' }],
      });
    });

    it('VALID: {a harness beside a .tsx source} => keeps the .ts harness paired with the .tsx target', () => {
      const result = harnessFileContract.parse(
        HarnessFileStub({ relPath: 'src/panel.harness.ts', targetRelPath: 'src/panel.tsx' }),
      );

      expect(result).toStrictEqual({
        relPath: 'src/panel.harness.ts',
        targetRelPath: 'src/panel.tsx',
        keys: [{ entry: 'audit', param: 'report' }],
      });
    });

    it('VALID: {two declared keys} => carries both, in the order the harness declared them', () => {
      const result = harnessFileContract.parse(
        HarnessFileStub({
          keys: [
            { entry: 'audit', param: 'report' },
            { entry: 'collect', param: 'sinks' },
          ],
        }),
      );

      expect(result).toStrictEqual({
        relPath: 'src/audit.harness.ts',
        targetRelPath: 'src/audit.ts',
        keys: [
          { entry: 'audit', param: 'report' },
          { entry: 'collect', param: 'sinks' },
        ],
      });
    });

    it('EMPTY: {no declared keys} => parses a harness that closes no gap', () => {
      const result = harnessFileContract.parse(HarnessFileStub({ keys: [] }));

      expect(result).toStrictEqual({
        relPath: 'src/audit.harness.ts',
        targetRelPath: 'src/audit.ts',
        keys: [],
      });
    });
  });

  describe('invalid harness files', () => {
    // Every field is required — an omitted target reads as a harness closing nothing, and an omitted
    // keys array reads as an empty declaration rather than an unparsed one. Derived from the
    // contract's own shape rather than a hand-typed list, so a field added later is covered with no
    // edit here.
    const REQUIRED_FIELDS = Object.keys(harnessFileContract.shape);

    it.each(REQUIRED_FIELDS)('INVALID: {missing %s} => throws validation error', (field) => {
      const entries = Object.entries(HarnessFileStub()).filter(([key]) => key !== field);

      expect(() => harnessFileContract.parse(Object.fromEntries(entries))).toThrow(/Required/u);
    });

    it('EMPTY: {relPath: ""} => throws validation error', () => {
      expect(() => {
        return harnessFileContract.parse({ relPath: '', targetRelPath: 'src/audit.ts', keys: [] });
      }).toThrow(/at least 1/u);
    });
  });
});
