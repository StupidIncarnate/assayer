import { packageNameContract } from './package-name-contract';
import { PackageNameStub } from './package-name.stub';

describe('packageNameContract', () => {
  describe('valid package names', () => {
    it('VALID: {value: "react"} => parses a bare package name', () => {
      const name = PackageNameStub({ value: 'react' });

      const result = packageNameContract.parse(name);

      expect(result).toBe('react');
    });

    it('VALID: {value: "@scope/pkg"} => parses a scoped package name', () => {
      const result = packageNameContract.parse('@scope/pkg');

      expect(result).toBe('@scope/pkg');
    });

    it('VALID: {value: "fs"} => parses a node builtin name', () => {
      const result = packageNameContract.parse('fs');

      expect(result).toBe('fs');
    });
  });

  describe('invalid package names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return packageNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
