import { relPathContract } from './rel-path-contract';
import { RelPathStub } from './rel-path.stub';

describe('relPathContract', () => {
  describe('valid paths', () => {
    it('VALID: {value: "packages/shared/src/index.ts"} => parses successfully', () => {
      const result = relPathContract.parse('packages/shared/src/index.ts');

      expect(result).toBe('packages/shared/src/index.ts');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const path = RelPathStub();

      const result = relPathContract.parse(path);

      expect(result).toBe('packages/shared/src/index.ts');
    });
  });

  describe('invalid paths', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return relPathContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
