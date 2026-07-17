import { envValueContract } from './env-value-contract';
import { EnvValueStub } from './env-value.stub';

describe('envValueContract', () => {
  describe('valid env values', () => {
    it('VALID: {value: "6"} => parses successfully', () => {
      const value = EnvValueStub({ value: '6' });

      const result = envValueContract.parse(value);

      expect(result).toBe('6');
    });

    // The environment can hold an empty string, and it is a meaningful input: it is what a falsy
    // check sees. Refusing it here would make a whole arm underivable.
    it('EMPTY: {value: ""} => parses successfully', () => {
      const result = envValueContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid env values', () => {
    it('INVALID: {value: 6} => throws validation error', () => {
      expect(() => {
        return envValueContract.parse(6 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
