import { assayerConfigContract } from './assayer-config-contract';
import { AssayerConfigStub } from './assayer-config.stub';

describe('assayerConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: {} => applies defaults in exact key order', () => {
      const result = assayerConfigContract.parse({});

      expect(JSON.stringify(result)).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn","deadSurface":"error","inputGaps":"error","runMode":"thorough"}',
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
        inputGaps: 'error',
        runMode: 'thorough',
      });
    });

    it('VALID: {inputGaps: "warn"} => preserved, so a repo mid-adoption reports gaps without failing', () => {
      const result = assayerConfigContract.parse({ inputGaps: 'warn' });

      expect(result.inputGaps).toBe('warn');
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

    it('VALID: {darkSpots: "error"} => preserved, so a repo can escalate a dark spot to a build failure', () => {
      const result = assayerConfigContract.parse({ darkSpots: 'error' });

      expect(result.darkSpots).toBe('error');
    });

    it('VALID: {deadSurface: "off"} => preserved, unlike darkSpots this channel can be silenced entirely', () => {
      const result = assayerConfigContract.parse({ deadSurface: 'off' });

      expect(result.deadSurface).toBe('off');
    });
  });

  describe('invalid configs', () => {
    it('INVALID: {version: "2"} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ version: '2' });
      }).toThrow(/Invalid input: expected/u);
    });

    it('INVALID: {repoRoot: 123} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ repoRoot: 123 });
      }).toThrow(/Invalid input: expected string, received number/u);
    });

    it('INVALID: {repoRoot: ""} => throws, since an empty path names no root', () => {
      expect(() => {
        return assayerConfigContract.parse({ repoRoot: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {stableBranch: ""} => throws, since an empty branch name names nothing to diff against', () => {
      expect(() => {
        return assayerConfigContract.parse({ stableBranch: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {exclude: [""]} => throws, since an empty glob pattern excludes nothing', () => {
      expect(() => {
        return assayerConfigContract.parse({ exclude: [''] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {darkSpots: "off"} => throws, since darkSpots (unlike deadSurface/inputGaps) admits no off value', () => {
      expect(() => {
        return assayerConfigContract.parse({ darkSpots: 'off' });
      }).toThrow(/Invalid option: expected one of \\"warn\\"\|\\"error\\"/u);
    });

    it('INVALID: {deadSurface: "bogus"} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ deadSurface: 'bogus' });
      }).toThrow(/Invalid option: expected one of \\"off\\"\|\\"warn\\"\|\\"error\\"/u);
    });

    it('INVALID: {inputGaps: "bogus"} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ inputGaps: 'bogus' });
      }).toThrow(/Invalid option: expected one of \\"off\\"\|\\"warn\\"\|\\"error\\"/u);
    });

    it('INVALID: {runMode: "bogus"} => throws validation error', () => {
      expect(() => {
        return assayerConfigContract.parse({ runMode: 'bogus' });
      }).toThrow(/Invalid option: expected one of \\"thorough\\"\|\\"intelligent\\"/u);
    });
  });
});
