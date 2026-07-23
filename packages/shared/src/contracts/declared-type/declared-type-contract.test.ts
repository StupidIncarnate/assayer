import { declaredTypeContract } from './declared-type-contract';
import { DeclaredTypeStub } from './declared-type.stub';

describe('declaredTypeContract', () => {
  describe('valid declared types', () => {
    it('VALID: {stub default} => parses the named property list', () => {
      const declared = DeclaredTypeStub();

      const result = declaredTypeContract.parse(declared);

      expect(result).toStrictEqual({
        name: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      });
    });

    it('VALID: {a nested object property} => parses the recursive descriptor', () => {
      const result = declaredTypeContract.parse({
        name: 'Outer',
        properties: [{ name: 'inner', type: { kind: 'object', typeName: 'Inner', properties: [] } }],
      });

      expect(result).toStrictEqual({
        name: 'Outer',
        properties: [{ name: 'inner', type: { kind: 'object', typeName: 'Inner', properties: [] } }],
      });
    });
  });

  describe('invalid declared types', () => {
    it('INVALID: {no name} => throws validation error', () => {
      expect(() => {
        return declaredTypeContract.parse({ properties: [] });
      }).toThrow(/Required/u);
    });
  });
});
