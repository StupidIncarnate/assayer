import { compileModeContract } from './compile-mode-contract';
import { CompileModeStub } from './compile-mode.stub';

describe('compileModeContract', () => {
  describe('valid compile modes', () => {
    it('VALID: {value: "net-new"} => parses successfully', () => {
      const mode = CompileModeStub({ value: 'net-new' });

      const result = compileModeContract.parse(mode);

      expect(result).toBe('net-new');
    });

    it('VALID: {value: "skipped"} => parses successfully', () => {
      const result = compileModeContract.parse('skipped');

      expect(result).toBe('skipped');
    });
  });

  describe('invalid compile modes', () => {
    it('INVALID: {value: "cached"} => throws validation error', () => {
      expect(() => {
        return compileModeContract.parse('cached');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
