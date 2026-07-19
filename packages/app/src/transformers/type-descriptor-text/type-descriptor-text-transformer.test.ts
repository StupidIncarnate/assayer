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

  describe('opaque types', () => {
    it('VALID: {kind: unknown, text: "Date"} => renders the carried type text', () => {
      const result = typeDescriptorTextTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Date' }) });

      expect(String(result)).toBe('Date');
    });
  });
});
