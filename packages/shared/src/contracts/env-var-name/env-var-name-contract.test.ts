import { envVarNameContract } from './env-var-name-contract';
import { EnvVarNameStub } from './env-var-name.stub';

describe('envVarNameContract', () => {
  describe('valid env var names', () => {
    it('VALID: {value: "VALUE"} => parses successfully', () => {
      const name = EnvVarNameStub({ value: 'VALUE' });

      const result = envVarNameContract.parse(name);

      expect(result).toBe('VALUE');
    });
  });

  describe('invalid env var names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return envVarNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
