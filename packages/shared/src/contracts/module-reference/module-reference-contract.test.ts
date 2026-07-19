import { moduleReferenceContract } from './module-reference-contract';
import { ModuleReferenceStub } from './module-reference.stub';

describe('moduleReferenceContract', () => {
  describe('valid module references', () => {
    it('VALID: {stub default} => carries the specifier, imported name, and use position', () => {
      const reference = ModuleReferenceStub();

      const result = moduleReferenceContract.parse(reference);

      expect(result).toStrictEqual({ specifier: './other', importedName: 'foo', line: 1, column: 1 });
    });

    it('VALID: {a positioned call to a package import} => carries the call line and column', () => {
      const result = moduleReferenceContract.parse({
        specifier: 'react',
        importedName: 'useState',
        line: 5,
        column: 10,
      });

      expect(result).toStrictEqual({ specifier: 'react', importedName: 'useState', line: 5, column: 10 });
    });
  });

  describe('invalid module references', () => {
    it('INVALID: {column: 0} => throws validation error', () => {
      expect(() => {
        return moduleReferenceContract.parse({ specifier: './other', importedName: 'foo', line: 1, column: 0 });
      }).toThrow(/greater than 0/u);
    });
  });
});
