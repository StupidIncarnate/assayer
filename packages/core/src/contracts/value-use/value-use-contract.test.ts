import { valueUseContract } from './value-use-contract';
import { ValueUseStub } from './value-use.stub';

describe('valueUseContract', () => {
  describe('valid value uses', () => {
    it('VALID: {stub default} => an import value use naming the specifier and imported name', () => {
      const result = valueUseContract.parse(ValueUseStub());

      expect(result).toStrictEqual({ target: 'import', specifier: 'node:path', importedName: 'sep' });
    });

    it('VALID: {a local function reference} => keyed by name and start line', () => {
      const result = valueUseContract.parse({ target: 'local', name: 'inner', startLine: 2 });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 2 });
    });

    it('VALID: {a bare ambient global reference} => keyed by name with no member', () => {
      const result = valueUseContract.parse({ target: 'global', name: 'process' });

      expect(result).toStrictEqual({ target: 'global', name: 'process' });
    });

    it('VALID: {an ambient global member access} => keyed by name and member', () => {
      const result = valueUseContract.parse({ target: 'global', name: 'process', member: 'env' });

      expect(result).toStrictEqual({ target: 'global', name: 'process', member: 'env' });
    });
  });

  describe('invalid value uses', () => {
    it('INVALID: {target "unresolved"} => throws on the target discriminator', () => {
      expect(() => {
        return valueUseContract.parse({ target: 'unresolved' });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
