import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

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

  describe('a template literal type', () => {
    it('EMPTY: {template with no substitutions} => returns its single literal segment unchanged', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({ kind: 'template', texts: ['no-subs'], types: [] }),
        }),
      ).toBe('no-subs');
    });

    it('VALID: {template with one substitution} => interpolates its point between the literal segments', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
        }),
      ).toBe('id-abc123');
    });

    it('VALID: {template with several substitutions} => interpolates each point in order', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({
            kind: 'template',
            texts: ['a-', '-b-', ''],
            types: [{ kind: 'string' }, { kind: 'number' }],
          }),
        }),
      ).toBe('a-abc123-b-7');
    });

    // One substitution refusing (an object has no scalar point) refuses the whole template — there is
    // no way to interpolate a hole into a string.
    it('INVALID: {template whose substitution has no representative point} => returns undefined', () => {
      expect(
        representativeValueTransformer({
          type: TypeDescriptorStub({
            kind: 'template',
            texts: ['cfg-', ''],
            types: [
              TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
            ],
          }),
        }),
      ).toBe(undefined);
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

  describe('offset for distinct values', () => {
    it('VALID: {number with offset 1} => returns 8 (7 + 1)', () => {
      expect(representativeValueTransformer({ type: { kind: 'number' }, offset: 1 })).toBe(8);
    });

    it('VALID: {number with offset 2} => returns 9 (7 + 2)', () => {
      expect(representativeValueTransformer({ type: { kind: 'number' }, offset: 2 })).toBe(9);
    });

    it('VALID: {string with offset 1} => returns "abc123_1"', () => {
      expect(representativeValueTransformer({ type: { kind: 'string' }, offset: 1 })).toBe('abc123_1');
    });

    it('VALID: {boolean with offset 1} => returns true', () => {
      expect(representativeValueTransformer({ type: { kind: 'boolean' }, offset: 1 })).toBe(true);
    });
  });
});
