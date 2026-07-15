import { execResultContract } from './exec-result-contract';
import { ExecResultStub } from './exec-result.stub';

describe('execResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stub default} => parses a clean exit', () => {
      expect(execResultContract.parse(ExecResultStub())).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });

    // A failing `assayer unit` writes its report to stderr and exits 1 — that is a RESULT, not an
    // error to throw over.
    it('VALID: {exit 1 with a report on stderr} => parses', () => {
      const result = execResultContract.parse({ exitCode: 1, stdout: '', stderr: 'src/a.ts  0/1 passed' });

      expect(result).toStrictEqual({ exitCode: 1, stdout: '', stderr: 'src/a.ts  0/1 passed' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {no exitCode} => throws, since it is the whole point of capturing', () => {
      expect(() => {
        return execResultContract.parse({ stdout: '', stderr: '' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {a fractional exit code} => throws', () => {
      expect(() => {
        return execResultContract.parse({ exitCode: 1.5, stdout: '', stderr: '' });
      }).toThrow(/integer/u);
    });
  });
});
