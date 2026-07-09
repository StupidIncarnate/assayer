import { compileResultContract } from './compile-result-contract';
import { CompileResultStub } from './compile-result.stub';

describe('compileResultContract', () => {
  describe('valid compile results', () => {
    it('VALID: {stub} => parses successfully', () => {
      const result = compileResultContract.parse(CompileResultStub());

      expect(result.status).toBe('ok');
    });

    it('VALID: {status: errors, one error} => parses error entry', () => {
      const result = compileResultContract.parse({
        status: 'errors',
        results: [{ namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 }],
        errors: [{ namespace: 'master', relPath: 'a.ts', line: 1, column: 1, message: 'Unexpected token' }],
      });

      expect(result.errors[0]?.message).toBe('Unexpected token');
    });
  });

  describe('invalid compile results', () => {
    it('INVALID: {status: "partial"} => throws validation error', () => {
      expect(() => {
        return compileResultContract.parse({
          status: 'partial',
          results: [{ namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 }],
          errors: [],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {error missing message} => throws validation error', () => {
      expect(() => {
        return compileResultContract.parse({
          status: 'errors',
          results: [{ namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 }],
          errors: [{ namespace: 'master', relPath: 'a.ts', line: 1, column: 1 }],
        });
      }).toThrow(/Required/u);
    });
  });
});
