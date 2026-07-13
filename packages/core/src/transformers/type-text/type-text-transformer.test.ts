import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { typeTextTransformer } from './type-text-transformer';

describe('typeTextTransformer', () => {
  describe('primitive descriptors', () => {
    it('VALID: {type: string} => returns "string"', () => {
      expect(typeTextTransformer({ type: { kind: 'string' } })).toBe('string');
    });

    it('VALID: {type: unknown void} => returns the carried text', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'void' }) })).toBe('void');
    });
  });

  describe('composite descriptors', () => {
    it('VALID: {type: literal "a"} => returns the JSON form', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 'a' }) })).toBe('"a"');
    });

    it('VALID: {type: union} => joins member texts with a pipe', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({
            kind: 'union',
            members: [TypeDescriptorStub({ kind: 'literal', value: 'a' }), { kind: 'string' }],
          }),
        }),
      ).toBe('"a" | string');
    });
  });
});
