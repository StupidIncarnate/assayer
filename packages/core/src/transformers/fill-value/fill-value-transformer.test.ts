import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { fillValueTransformer } from './fill-value-transformer';

const CALLABLE = TypeDescriptorStub({ kind: 'callable', text: '(m: string) => string' });

describe('fillValueTransformer', () => {
  describe('a scalar type', () => {
    it('VALID: {string} => its representative', () => {
      expect(fillValueTransformer({ type: { kind: 'string' } })).toBe('abc123');
    });

    it('VALID: {number} => its representative', () => {
      expect(fillValueTransformer({ type: { kind: 'number' } })).toBe(7);
    });
  });

  describe('an array', () => {
    it('VALID: {number[]} => a real one-element array', () => {
      expect(fillValueTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }) })).toStrictEqual([7]);
    });

    it('VALID: {number[][]} => a real nested array', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'array', element: { kind: 'number' } } }),
        }),
      ).toStrictEqual([[7]]);
    });

    it('VALID: {an array of objects} => a real array of real objects', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'array',
            element: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
          }),
        }),
      ).toStrictEqual([{ host: 'abc123' }]);
    });

    it('INVALID: {an array of callables} => undefined', () => {
      expect(fillValueTransformer({ type: TypeDescriptorStub({ kind: 'array', element: CALLABLE }) })).toBe(undefined);
    });

    // The empty cardinality is what terminates a self-reference, and `[]` is a complete value of
    // `TreeNode[]` without the reader ever finishing the element.
    it('VALID: {an array whose element the reader truncated} => the empty array', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'array',
            element: { kind: 'object', typeName: 'TreeNode', truncated: true, properties: [] },
          }),
        }),
      ).toStrictEqual([]);
    });
  });

  describe('a tuple', () => {
    it('EMPTY: {an empty tuple} => the empty array', () => {
      expect(fillValueTransformer({ type: TypeDescriptorStub({ kind: 'tuple', elements: [] }) })).toStrictEqual([]);
    });

    it('VALID: {a two-element tuple of different scalar types} => a real heterogeneous array, one value per position', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
        }),
      ).toStrictEqual(['abc123', 7]);
    });

    it('VALID: {a tuple nested inside a tuple} => a real array nested one level deep', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'tuple',
            elements: [{ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'boolean' }] }, { kind: 'number' }],
          }),
        }),
      ).toStrictEqual([['abc123', false], 7]);
    });

    // The length check is how this decides: one unfillable position drops out of the flatMap, so the
    // built array is one element short. Comparing that count against the declared position count is
    // what refuses the whole tuple instead of silently returning the short array.
    it('INVALID: {a tuple containing an element nothing can fill} => undefined, never a short array', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, CALLABLE, { kind: 'number' }] }),
        }),
      ).toBe(undefined);
    });
  });

  describe('an object', () => {
    // The nesting is the point: an object value nests exactly as an array value does, so a deep
    // property shape is BUILT rather than flattened to one level.
    it('VALID: {a nested object} => a real map, nested all the way down', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Config',
            properties: [
              { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
              { name: 'mode', type: { kind: 'string' } },
            ],
          }),
        }),
      ).toStrictEqual({ db: { host: 'abc123' }, mode: 'abc123' });
    });

    it('EMPTY: {an object with no properties} => {}', () => {
      expect(
        fillValueTransformer({ type: TypeDescriptorStub({ kind: 'object', typeName: 'Empty', properties: [] }) }),
      ).toStrictEqual({});
    });

    // The re-entered `Tree` is MARKED truncated, so its empty property list refuses instead of building
    // `{}` — and that refusal propagates out through the enclosing `Tree`, which requires `label`.
    it('INVALID: {a self-referential type} => undefined, never a {} that fails the declared shape', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Tree',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'next', type: { kind: 'object', typeName: 'Tree', truncated: true, properties: [] } },
            ],
          }),
        }),
      ).toBe(undefined);
    });

    // The other half of the same mark: recursion through an ARRAY terminates at `[]`, so a tree node
    // is a complete value while `interface Tree { label: string; next: Tree }` still has none.
    it('VALID: {a type whose only recursion is through an array} => a real node with no children', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'TreeNode',
            properties: [
              {
                name: 'children',
                type: { kind: 'array', element: { kind: 'object', typeName: 'TreeNode', truncated: true, properties: [] } },
              },
              { name: 'label', type: { kind: 'string' } },
            ],
          }),
        }),
      ).toStrictEqual({ children: [], label: 'abc123' });
    });

    // Only REQUIRED properties are owed a value — the object twin of an optional parameter nobody has
    // to pass. An optional property is simply omitted, never attempted.
    it('VALID: {an object with an optional string property} => the optional property is omitted entirely', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Report',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'nickname', type: { kind: 'string' }, optional: true },
            ],
          }),
        }),
      ).toStrictEqual({ label: 'abc123' });
    });

    // An UNFILLABLE optional property does not refuse the whole object — it is excluded from `owed`
    // before a fill is even attempted, so its own refusal never propagates outward.
    it('VALID: {an object whose only unfillable property is optional} => the required properties fill, the optional one is skipped', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Report',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'onSave', type: CALLABLE, optional: true },
            ],
          }),
        }),
      ).toStrictEqual({ label: 'abc123' });
    });

    it('INVALID: {an object with a callable member} => undefined, never a partial object', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Sink', properties: [{ name: 'write', type: CALLABLE }] }),
        }),
      ).toBe(undefined);
    });
  });

  describe('a union', () => {
    it('VALID: {a union whose first member is a callable} => a value of the first fillable member', () => {
      expect(
        fillValueTransformer({ type: TypeDescriptorStub({ kind: 'union', members: [CALLABLE, { kind: 'number' }] }) }),
      ).toBe(7);
    });

    it('INVALID: {a union of only unfillable members} => undefined', () => {
      expect(
        fillValueTransformer({
          type: TypeDescriptorStub({
            kind: 'union',
            members: [CALLABLE, TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' })],
          }),
        }),
      ).toBe(undefined);
    });
  });

  describe('a type nothing can be built for', () => {
    it('INVALID: {a callable} => undefined', () => {
      expect(fillValueTransformer({ type: CALLABLE })).toBe(undefined);
    });

    it('INVALID: {an opaque unknown} => undefined', () => {
      expect(fillValueTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' }) })).toBe(undefined);
    });
  });

  describe('offset for distinct values', () => {
    it('VALID: {number with offset 1} => returns 8', () => {
      expect(fillValueTransformer({ type: { kind: 'number' }, offset: 1 })).toBe(8);
    });

    it('VALID: {string with offset 1} => returns "abc123_1"', () => {
      expect(fillValueTransformer({ type: { kind: 'string' }, offset: 1 })).toBe('abc123_1');
    });

    it('VALID: {number[] with offset 1} => returns [8]', () => {
      expect(
        fillValueTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }), offset: 1 }),
      ).toStrictEqual([8]);
    });
  });
});
