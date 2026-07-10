import { exitCodeContract } from './exit-code-contract';
import { ExitCodeStub } from './exit-code.stub';

describe('exitCodeContract', () => {
  describe('valid exit codes', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const result = exitCodeContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const code = ExitCodeStub();

      const result = exitCodeContract.parse(code);

      expect(result).toBe(0);
    });
  });

  describe('invalid exit codes', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => {
        return exitCodeContract.parse(-1);
      }).toThrow(/./u);
    });
  });
});
