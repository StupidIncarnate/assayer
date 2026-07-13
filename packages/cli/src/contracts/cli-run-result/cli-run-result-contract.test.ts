import { cliRunResultContract } from './cli-run-result-contract';
import { CliRunResultStub } from './cli-run-result.stub';

describe('cliRunResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stdout, stderr, exitCode: 0} => parses successfully', () => {
      const result = cliRunResultContract.parse(
        CliRunResultStub({ stdout: 'assayer 1.0.0\n', stderr: '', exitCode: 0 }),
      );

      expect(result).toStrictEqual({ stdout: 'assayer 1.0.0\n', stderr: '', exitCode: 0 });
    });

    it('VALID: {exitCode: 1, stderr populated} => parses an error result', () => {
      const result = cliRunResultContract.parse(
        CliRunResultStub({ stdout: '', stderr: 'Unknown command: frobnicate\n', exitCode: 1 }),
      );

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'Unknown command: frobnicate\n',
        exitCode: 1,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {exitCode: 1.5} => throws for a non-integer exit code', () => {
      expect(() => {
        return cliRunResultContract.parse({ stdout: '', stderr: '', exitCode: 1.5 });
      }).toThrow(/[Ee]xpected integer/u);
    });
  });
});
