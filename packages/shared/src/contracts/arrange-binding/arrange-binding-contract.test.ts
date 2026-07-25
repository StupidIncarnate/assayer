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

    it('VALID: {a nested property value} => parses the recursive map, so { db: { host } } is representable', () => {
      const result = arrangeBindingContract.parse({ kind: 'object', param: 'config', value: { db: { host: 'localhost' } } });

      expect(result).toStrictEqual({ kind: 'object', param: 'config', value: { db: { host: 'localhost' } } });
    });

    it('VALID: {a property holding an array} => parses, since a property takes the same value an element does', () => {
      const result = arrangeBindingContract.parse({ kind: 'object', param: 'config', value: { ports: [7], db: { host: 'x' } } });

      expect(result).toStrictEqual({ kind: 'object', param: 'config', value: { ports: [7], db: { host: 'x' } } });
    });
  });

  describe('a harness binding', () => {
    it('VALID: {kind: "harness"} => parses the parameter and its key path, carrying no value', () => {
      const result = arrangeBindingContract.parse({ kind: 'harness', param: 'report', key: 'inputs.audit.report' });

      expect(result).toStrictEqual({ kind: 'harness', param: 'report', key: 'inputs.audit.report' });
    });

    it('INVALID: {kind: "harness" with a value} => strips it, since the value lives only in the loaded harness', () => {
      const result = arrangeBindingContract.parse({
        kind: 'harness',
        param: 'report',
        key: 'inputs.audit.report',
        value: 'abc123',
      } as never);

      expect(result).toStrictEqual({ kind: 'harness', param: 'report', key: 'inputs.audit.report' });
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
