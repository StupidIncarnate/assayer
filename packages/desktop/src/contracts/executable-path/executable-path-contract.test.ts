import { executablePathContract } from './executable-path-contract';
import { ExecutablePathStub } from './executable-path.stub';

describe('executablePathContract', () => {
  describe('valid executable paths', () => {
    it('VALID: {value: "/usr/bin/electron"} => parses successfully', () => {
      const path = ExecutablePathStub({ value: '/usr/bin/electron' });

      const result = executablePathContract.parse(path);

      expect(result).toBe('/usr/bin/electron');
    });
  });

  describe('invalid executable paths', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return executablePathContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
