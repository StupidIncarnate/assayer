import { arrangeBindingContract } from './arrange-binding-contract';
import { ArrangeBindingStub } from './arrange-binding.stub';

describe('arrangeBindingContract', () => {
  describe('a positional param binding', () => {
    it('VALID: {kind: "param", value: ""} => parses the argument', () => {
      expect(arrangeBindingContract.parse(ArrangeBindingStub())).toStrictEqual({ kind: 'param', param: 'name', value: '' });
    });
  });

  describe('an environment binding', () => {
    it('VALID: {kind: "env"} => parses the key/value', () => {
      const result = arrangeBindingContract.parse({ kind: 'env', name: 'LEVEL', value: '6' });

      expect(result).toStrictEqual({ kind: 'env', name: 'LEVEL', value: '6' });
    });
  });

  describe('an array binding', () => {
    it('VALID: {kind: "array", value: [7]} => parses the list', () => {
      const result = arrangeBindingContract.parse({ kind: 'array', param: 'items', value: [7] });

      expect(result).toStrictEqual({ kind: 'array', param: 'items', value: [7] });
    });

    it('VALID: {a nested array element} => parses the recursive list', () => {
      const result = arrangeBindingContract.parse({ kind: 'array', param: 'grid', value: [[7]] });

      expect(result).toStrictEqual({ kind: 'array', param: 'grid', value: [[7]] });
    });
  });

  describe('an object binding', () => {
    it('VALID: {kind: "object"} => parses the property map', () => {
      const result = arrangeBindingContract.parse({ kind: 'object', param: 'config', value: { mode: 'dev' } });

      expect(result).toStrictEqual({ kind: 'object', param: 'config', value: { mode: 'dev' } });
    });
  });

  describe('a malformed binding', () => {
    it('INVALID: {kind: "callback"} => throws validation error', () => {
      expect(() => {
        return arrangeBindingContract.parse({ kind: 'callback' } as never);
      }).toThrow(/invalid_union_discriminator|Invalid discriminator/u);
    });
  });
});
