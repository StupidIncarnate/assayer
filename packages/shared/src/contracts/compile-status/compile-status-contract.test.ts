import { compileStatusContract } from './compile-status-contract';
import { CompileStatusStub } from './compile-status.stub';

describe('compileStatusContract', () => {
  describe('valid compile statuses', () => {
    it('VALID: {value: "ok"} => parses successfully', () => {
      const status = CompileStatusStub({ value: 'ok' });

      const result = compileStatusContract.parse(status);

      expect(result).toBe('ok');
    });

    it('VALID: {value: "errors"} => parses successfully', () => {
      const result = compileStatusContract.parse('errors');

      expect(result).toBe('errors');
    });
  });

  describe('invalid compile statuses', () => {
    it('INVALID: {value: "partial"} => throws validation error', () => {
      expect(() => {
        return compileStatusContract.parse('partial');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
