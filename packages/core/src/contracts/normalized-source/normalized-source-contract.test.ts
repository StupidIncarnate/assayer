import { normalizedSourceContract } from './normalized-source-contract';
import { NormalizedSourceStub } from './normalized-source.stub';

describe('normalizedSourceContract', () => {
  describe('valid input', () => {
    it('VALID: {stub default} => parses to the branded value', () => {
      expect(NormalizedSourceStub()).toBe('name.length === 0');
    });

    it('VALID: {custom fragment} => parses to the branded value', () => {
      expect(NormalizedSourceStub({ value: 'x === 1' })).toBe('x === 1');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {empty string} => throws', () => {
      expect(() => normalizedSourceContract.parse('')).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {number} => throws', () => {
      expect(() => normalizedSourceContract.parse(5)).toThrow(/Invalid input: expected string, received number/u);
    });
  });
});
