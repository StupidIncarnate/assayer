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
  });

  describe('invalid harness files', () => {
    it('INVALID: {no targetRelPath} => throws validation error', () => {
      expect(() => {
        return harnessFileContract.parse({ relPath: 'src/audit.harness.ts', keys: [] });
      }).toThrow(/Required/u);
    });
  });
});
