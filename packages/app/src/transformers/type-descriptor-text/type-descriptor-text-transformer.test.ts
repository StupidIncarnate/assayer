import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { typeDescriptorTextTransformer } from './type-descriptor-text-transformer';

describe('typeDescriptorTextTransformer', () => {
  describe('primitive types', () => {
    it('VALID: {kind: string} => renders "string"', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'string' }) });

      expect(String(result)).toBe('string');
    });

    it('VALID: {kind: number} => renders "number"', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'number' }) });

      expect(String(result)).toBe('number');
    });

    it('VALID: {kind: boolean} => renders "boolean"', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'boolean' }) });

      expect(String(result)).toBe('boolean');
    });
  });

  describe('literal types', () => {
    it('VALID: {kind: literal, value: "get"} => renders the quoted literal', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 'get' }) });

      expect(String(result)).toBe('"get"');
    });

    it('VALID: {kind: literal, value: 7} => renders the numeric literal', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 7 }) });

      expect(String(result)).toBe('7');
    });
  });

  describe('union types', () => {
    it('VALID: {union of two string literals} => joins members with " | "', () => {
      const result = typeDescriptorTextTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'literal', value: 'get' },
            { kind: 'literal', value: 'post' },
          ],
        }),
      });

      expect(String(result)).toBe('"get" | "post"');
    });
  });

  describe('array types', () => {
    it('VALID: {array of string} => renders "string[]"', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }) });

      expect(String(result)).toBe('string[]');
    });
  });

  describe('object types', () => {
    it('VALID: {named object} => renders the type name', () => {
      const result = typeDescriptorTextTransformer({
        type: TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
      });

      expect(String(result)).toBe('Config');
    });

    it('VALID: {anonymous object} => renders the braced property list', () => {
      const result = typeDescriptorTextTransformer({
        type: TypeDescriptorStub({
          kind: 'object',
          properties: [
            { name: 'a', type: { kind: 'string' } },
            { name: 'b', type: { kind: 'number' } },
          ],
        }),
      });

      expect(String(result)).toBe('{ a: string; b: number }');
    });
  });

  describe('callable types', () => {
    it('VALID: {kind: callable} => renders the carried signature text', () => {
      const result = typeDescriptorTextTransformer({
        type: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }),
      });

      expect(String(result)).toBe('(message: string) => string');
    });
  });

  describe('opaque types', () => {
    it('VALID: {kind: unknown, text: "Date"} => renders the carried type text', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Date' }) });

      expect(String(result)).toBe('Date');
    });
  });

  describe('an unrecognized kind', () => {
    // The TypeDescriptor union is exhaustive over the 11 declared kinds, so this arm is unreachable
    // through any value the type system admits — `as never` is the documented escape hatch for
    // driving a case the checker itself refuses to construct.
    it("EDGE: {kind not in the TypeDescriptor union} => falls back to 'unknown'", () => {
      const result = typeDescriptorTextTransformer({ type: { kind: 'nonsense' } as never });

      expect(String(result)).toBe('unknown');
    });
  });
});
