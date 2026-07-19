import { moduleSpecifierContract } from './module-specifier-contract';
import { ModuleSpecifierStub } from './module-specifier.stub';

describe('moduleSpecifierContract', () => {
  describe('valid module specifiers', () => {
    it('VALID: {value: "./other"} => parses successfully', () => {
      const specifier = ModuleSpecifierStub({ value: './other' });

      const result = moduleSpecifierContract.parse(specifier);

      expect(result).toBe('./other');
    });

    it('VALID: {value: "react"} => parses a bare package specifier', () => {
      const result = moduleSpecifierContract.parse('react');

      expect(result).toBe('react');
    });
  });

  describe('invalid module specifiers', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return moduleSpecifierContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
