import { generateRunResultContract } from './generate-run-result-contract';
import { GenerateRunResultStub } from './generate-run-result.stub';

describe('generateRunResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stub default} => parses exit code 0 with its text', () => {
      const result = generateRunResultContract.parse(GenerateRunResultStub());

      expect(result).toStrictEqual({ exitCode: 0, output: 'smoke-repo is current: 1 specimens' });
    });

    it('VALID: {exitCode: 1} => parses a failing run', () => {
      const result = generateRunResultContract.parse(
        GenerateRunResultStub({ exitCode: 1 as never, output: 'refused' as never }),
      );

      expect(result).toStrictEqual({ exitCode: 1, output: 'refused' });
    });

    it('EMPTY: {output: ""} => parses, since a run may print nothing', () => {
      const result = generateRunResultContract.parse(GenerateRunResultStub({ output: '' as never }));

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {exitCode: -1} => throws, since an exit code is never negative', () => {
      expect(() => {
        return generateRunResultContract.parse({ exitCode: -1, output: '' });
      }).toThrow(/Too small: expected number to be >=0/u);
    });

    it('INVALID: {exitCode: 1.5} => throws, since an exit code is a whole number', () => {
      expect(() => {
        return generateRunResultContract.parse({ exitCode: 1.5, output: '' });
      }).toThrow(/Invalid input: expected int, received number/u);
    });
  });
});
