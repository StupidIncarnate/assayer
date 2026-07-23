import { typeDescriptorContract } from './type-descriptor-contract';
import { TypeDescriptorStub } from './type-descriptor.stub';

describe('typeDescriptorContract', () => {
  describe('valid type descriptors', () => {
    it('VALID: {kind: "string"} => parses the string descriptor', () => {
      const descriptor = TypeDescriptorStub();

      const result = typeDescriptorContract.parse(descriptor);

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {kind: "union", members} => parses nested literal members', () => {
      const result = typeDescriptorContract.parse({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'a' },
          { kind: 'literal', value: 'b' },
        ],
      });

      expect(result).toStrictEqual({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'a' },
          { kind: 'literal', value: 'b' },
        ],
      });
    });

    it('VALID: {kind: "array", element} => parses the element descriptor', () => {
      const result = typeDescriptorContract.parse({ kind: 'array', element: { kind: 'number' } });

      expect(result).toStrictEqual({ kind: 'array', element: { kind: 'number' } });
    });

    it('VALID: {kind: "object", typeName, properties} => parses the named property list', () => {
      const result = typeDescriptorContract.parse({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      });
    });

    it('VALID: {kind: "object", no typeName} => parses a keyless anonymous object', () => {
      const result = typeDescriptorContract.parse({
        kind: 'object',
        properties: [{ name: 'a', type: { kind: 'string' } }],
      });

      expect(result).toStrictEqual({
        kind: 'object',
        properties: [{ name: 'a', type: { kind: 'string' } }],
      });
    });
  });

  describe('invalid type descriptors', () => {
    it('INVALID: {kind: "tuple"} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'tuple' });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
