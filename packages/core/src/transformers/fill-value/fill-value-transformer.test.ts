import { TypeDescriptorStub } from '@assayer/shared/contracts';

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
});
