import { representativeValueContract, TypeDescriptorStub } from '@assayer/shared/contracts';

import { isTypeFillableGuard } from './is-type-fillable-guard';

const CALLABLE = TypeDescriptorStub({ kind: 'callable', text: '(m: string) => string' });
const OPAQUE = TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' });

describe('isTypeFillableGuard', () => {
  describe('a scalar type', () => {
    it('VALID: {string} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'string' } })).toBe(true);
    });

    it('VALID: {number} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'number' } })).toBe(true);
    });

    it('VALID: {boolean} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'boolean' } })).toBe(true);
    });

    it('VALID: {a literal} => true', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'literal', value: 5 }) })).toBe(true);
    });
  });

  describe('a union', () => {
    // SOME member is enough — a value of one member is a value of the union.
    it('VALID: {a union whose first member is a callable} => true', () => {
      expect(
        isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'union', members: [CALLABLE, { kind: 'number' }] }) }),
      ).toBe(true);
    });

    it('INVALID: {a union of only unfillable members} => false', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'union', members: [CALLABLE, OPAQUE] }) })).toBe(false);
    });

    it('EMPTY: {a union with no members} => false', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'union', members: [] }) })).toBe(false);
    });
  });

  describe('an array', () => {
    it('VALID: {number[]} => true', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }) })).toBe(true);
    });

    it('INVALID: {an array of callables} => false', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'array', element: CALLABLE }) })).toBe(false);
    });

    // The empty cardinality terminates a self-reference: `[]` is a complete value of `TreeNode[]`
    // whatever the reader learned about the element, which is what makes `TreeNode` itself buildable.
    it('VALID: {an array whose element the reader truncated} => true, fillable as []', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'array',
            element: { kind: 'object', typeName: 'TreeNode', truncated: true, properties: [] },
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {an object whose only recursion is through an array} => true', () => {
      expect(
        isTypeFillableGuard({
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
      ).toBe(true);
    });

    // An object element that is NOT the truncated re-entry mark still recurses through the element's
    // own fillability — `kind === 'object'` alone is not the short-circuit, `truncated === true` is.
    it('INVALID: {an array of a non-truncated object with an unfillable property} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'array',
            element: { kind: 'object', typeName: 'Sink', properties: [{ name: 'write', type: CALLABLE }] },
          }),
        }),
      ).toBe(false);
    });
  });

  describe('an object', () => {
    it('VALID: {every property scalar, nested} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Config',
            properties: [
              { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
              { name: 'mode', type: { kind: 'string' } },
            ],
          }),
        }),
      ).toBe(true);
    });

    // One hole makes the whole object unbuildable: half an object is a wrong input, not a partial one.
    it('INVALID: {an object with a callable member} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Sink', properties: [{ name: 'write', type: CALLABLE }] }),
        }),
      ).toBe(false);
    });

    // `interface Empty {}` and `Record<string, number>` both read as property-less, and `{}` is a
    // correct complete value of either. An index signature is invisible to the descriptor.
    it('EMPTY: {an object with no properties} => true, fillable as {}', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'object', typeName: 'Empty', properties: [] }) })).toBe(true);
    });

    // The reader truncates a re-entered type to a property-less shape and MARKS it, so this recursion
    // terminates on the mark. `{}` does not satisfy `interface Tree { label: string; next: Tree }`,
    // which is why the empty list a truncation leaves behind answers the opposite of an empty one.
    it('INVALID: {a self-referential type, truncated by the reader} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Tree',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'next', type: { kind: 'object', typeName: 'Tree', truncated: true, properties: [] } },
            ],
          }),
        }),
      ).toBe(false);
    });

    it('INVALID: {the truncated re-entry on its own} => false', () => {
      expect(
        isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'object', typeName: 'Tree', truncated: true, properties: [] }) }),
      ).toBe(false);
    });

    // Nobody OWES an optional property a value: the declaration's own `?` short-circuits the every()
    // check before the property's (unfillable) type is ever asked.
    it('VALID: {an object whose only unfillable property is OPTIONAL} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Sink',
            properties: [{ name: 'write', type: CALLABLE, optional: true }],
          }),
        }),
      ).toBe(true);
    });
  });

  describe('a type nothing can be built for', () => {
    it('INVALID: {a callable} => false', () => {
      expect(isTypeFillableGuard({ type: CALLABLE })).toBe(false);
    });

    it('INVALID: {an opaque unknown} => false', () => {
      expect(isTypeFillableGuard({ type: OPAQUE })).toBe(false);
    });

    it('EMPTY: {no type at all} => false', () => {
      expect(isTypeFillableGuard({})).toBe(false);
    });
  });

  // The second arity: not "can one be built" but "is THIS one". A candidate is a scalar, so it fits
  // only a type that has scalar values — which is what keeps a string demand out of a `string[]`.
  describe('a candidate value', () => {
    it('VALID: {string type, a string candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'string' }, value: representativeValueContract.parse('abc123') })).toBe(true);
    });

    it('INVALID: {string type, a number candidate} => false', () => {
      expect(isTypeFillableGuard({ type: { kind: 'string' }, value: representativeValueContract.parse(7) })).toBe(false);
    });

    it('VALID: {number type, a number candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'number' }, value: representativeValueContract.parse(7) })).toBe(true);
    });

    it('INVALID: {number type, a string candidate} => false', () => {
      expect(isTypeFillableGuard({ type: { kind: 'number' }, value: representativeValueContract.parse('7') })).toBe(false);
    });

    it('VALID: {boolean type, a boolean candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'boolean' }, value: representativeValueContract.parse(true) })).toBe(true);
    });

    it('INVALID: {boolean type, a null candidate} => false', () => {
      expect(isTypeFillableGuard({ type: { kind: 'boolean' }, value: representativeValueContract.parse(null) })).toBe(false);
    });

    it('VALID: {a literal type, its own value} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          value: representativeValueContract.parse('get'),
        }),
      ).toBe(true);
    });

    it('INVALID: {a literal type, another value} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          value: representativeValueContract.parse('post'),
        }),
      ).toBe(false);
    });

    it('VALID: {a union, a value one member admits} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'union', members: [CALLABLE, { kind: 'number' }] }),
          value: representativeValueContract.parse(7),
        }),
      ).toBe(true);
    });

    it('INVALID: {a union, a value no member admits} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'union', members: [CALLABLE, { kind: 'number' }] }),
          value: representativeValueContract.parse('abc123'),
        }),
      ).toBe(false);
    });

    // The FIX this arity exists for: a string demand unioned onto a `string[]` property by a length
    // guard in some OTHER entry is not a value of the array, however fillable the array is.
    it('INVALID: {string[] (fillable), a string candidate} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }),
          value: representativeValueContract.parse('abc123'),
        }),
      ).toBe(false);
    });

    it('INVALID: {an object type (fillable), a string candidate} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          value: representativeValueContract.parse('abc123'),
        }),
      ).toBe(false);
    });

    it('INVALID: {a callable, any candidate} => false', () => {
      expect(isTypeFillableGuard({ type: CALLABLE, value: representativeValueContract.parse('abc123') })).toBe(false);
    });
  });
});
