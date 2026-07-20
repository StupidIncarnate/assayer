import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { representativeValueTransformer } from './representative-value-transformer';

describe('representativeValueTransformer', () => {
  describe('primitive descriptors', () => {
    it('VALID: {type: string} => returns "abc123"', () => {
      expect(representativeValueTransformer({ type: { kind: 'string' } })).toBe('abc123');
    });

    it('VALID: {type: number} => returns 7', () => {
      expect(representativeValueTransformer({ type: { kind: 'number' } })).toBe(7);
    });

    it('VALID: {type: boolean} => returns false', () => {
      expect(representativeValueTransformer({ type: { kind: 'boolean' } })).toBe(false);
    });
  });

  describe('composite descriptors', () => {
    it('VALID: {type: literal 5} => returns 5', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 5 }) })).toBe(5);
    });

    it('VALID: {type: union of literals} => returns the first member value', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({
            kind: 'union',
            members: [TypeDescriptorStub({ kind: 'literal', value: 'x' }), TypeDescriptorStub({ kind: 'literal', value: 'y' })],
          }),
        }),
      ).toBe('x');
    });

    it('EMPTY: {type: union with no members} => returns "abc123"', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'union', members: [] }) })).toBe('abc123');
    });

    it('VALID: {type: unknown} => returns "abc123"', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Date' }) })).toBe('abc123');
    });
  });
});
