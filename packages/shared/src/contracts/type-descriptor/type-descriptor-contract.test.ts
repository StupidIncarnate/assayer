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
  });

  describe('invalid type descriptors', () => {
    it('INVALID: {kind: "tuple"} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'tuple' });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
