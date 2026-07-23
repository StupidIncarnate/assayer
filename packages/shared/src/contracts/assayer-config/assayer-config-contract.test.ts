import { assayerConfigContract } from './assayer-config-contract';
import { AssayerConfigStub } from './assayer-config.stub';

describe('assayerConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: {} => applies defaults in exact key order', () => {
      const result = assayerConfigContract.parse({});

      expect(JSON.stringify(result)).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn","deadSurface":"error","runMode":"thorough"}',
      );
    });

    it('VALID: {repoRoot, exclude} => parses overrides', () => {
      const stub = AssayerConfigStub({ repoRoot: './smoke-repo', exclude: ['dist'] });

      const result = assayerConfigContract.parse(stub);

      expect(result).toStrictEqual({
        version: '1',
        repoRoot: './smoke-repo',
        exclude: ['dist'],
        darkSpots: 'warn',
        deadSurface: 'error',
        runMode: 'thorough',
      });
    });

    it('VALID: {runMode: "intelligent"} => preserved as the display-only execution-subset toggle', () => {
      const result = assayerConfigContract.parse({ runMode: 'intelligent' });

      expect(result.runMode).toBe('intelligent');
    });

    it('VALID: {stableBranch: "main"} => parses optional field', () => {
      const stub = AssayerConfigStub({ stableBranch: 'main' });

      const result = assayerConfigContract.parse(stub);

      expect(result.stableBranch).toBe('main');
    });
  });

  describe('invalid configs', () => {
    it('INVALID: {version: "2"} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ version: '2' });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {repoRoot: 123} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ repoRoot: 123 });
      }).toThrow(/Expected string/u);
    });
  });
});
