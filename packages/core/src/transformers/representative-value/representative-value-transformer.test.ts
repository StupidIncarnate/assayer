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

    it('VALID: {type: literal 5} => returns 5', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 5 }) })).toBe(5);
    });
  });

  describe('a union', () => {
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

    // The first member with a SCALAR point, not simply the first member: a union whose head has no
    // scalar still samples from the half that does.
    it('VALID: {type: union whose first member is a callable} => returns the first scalar member value', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({
            kind: 'union',
            members: [
              TypeDescriptorStub({ kind: 'callable', text: '(m: string) => string' }),
              TypeDescriptorStub({ kind: 'literal', value: 'y' }),
            ],
          }),
        }),
      ).toBe('y');
    });

    it('EMPTY: {type: union with no members} => returns undefined', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'union', members: [] }) })).toBe(undefined);
    });
  });

  // No placeholder, on any of them. A string standing in for a shape is the defect: `payload.size` on
  // 'abc123' reads 6 and the case PASSES against an input the code was never given.
  describe('a type with no scalar point', () => {
    it('VALID: {type: array} => returns undefined', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }) })).toBe(
        undefined,
      );
    });

    it('VALID: {type: object} => returns undefined', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
        }),
      ).toBe(undefined);
    });

    it('VALID: {type: callable} => returns undefined', () => {
      expect(
        representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }) }),
      ).toBe(undefined);
    });

    it('VALID: {type: unknown} => returns undefined', () => {
      expect(representativeValueTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Date' }) })).toBe(undefined);
    });
  });
});
