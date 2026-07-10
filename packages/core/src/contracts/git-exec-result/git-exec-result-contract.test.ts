import { gitExecResultContract } from './git-exec-result-contract';
import { GitExecResultStub } from './git-exec-result.stub';

describe('gitExecResultContract', () => {
  describe('valid git exec results', () => {
    it('VALID: {exitCode: 0, stdout: "abc123\\n", stderr: ""} => parses successfully', () => {
      const result = GitExecResultStub({ exitCode: 0, stdout: 'abc123\n', stderr: '' });

      const parsed = gitExecResultContract.parse(result);

      expect(parsed).toStrictEqual({ exitCode: 0, stdout: 'abc123\n', stderr: '' });
    });
  });

  describe('invalid git exec results', () => {
    it('INVALID: {exitCode: "0", stdout: "", stderr: ""} => throws validation error', () => {
      expect(() => {
        return gitExecResultContract.parse({ exitCode: '0', stdout: '', stderr: '' });
      }).toThrow(/./u);
    });
  });
});
