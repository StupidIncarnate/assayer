import { arrangeValueContract, representativeValueContract, TypeDescriptorStub } from '@assayer/shared/contracts';

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

  describe('a tuple', () => {
    // Fixed-length and HETEROGENEOUS: every POSITION must admit its own type. An empty tuple has no
    // positions to fail, so `[].every()` is vacuously true, the same reason an object with no
    // properties fills as `{}`.
    it('EMPTY: {an empty tuple} => true, fillable as []', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'tuple', elements: [] }) })).toBe(true);
    });

    it('VALID: {a tuple whose every position is fillable} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
        }),
      ).toBe(true);
    });

    // One unfillable position makes the whole tuple unbuildable, the same rule an object's required
    // property states: half a tuple is a wrong input, not a partial one.
    it('INVALID: {a tuple with one unfillable position} => false', () => {
      expect(
        isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, CALLABLE] }) }),
      ).toBe(false);
    });
  });

  describe('a template', () => {
    // No substitutions is still a valid template: a plain string constant spelled through the
    // template syntax. `[].every()` is vacuously true here too.
    it('VALID: {a template with no substitutions} => true', () => {
      expect(isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'template', texts: ['id-'], types: [] }) })).toBe(
        true,
      );
    });

    it('VALID: {a template with several fillable substitutions} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'template',
            texts: ['id-', '-', ''],
            types: [{ kind: 'string' }, { kind: 'number' }],
          }),
        }),
      ).toBe(true);
    });

    // Asked through `representative-value-transformer`, the same function that will actually build the
    // interpolated string: a substitution it cannot produce a point for refuses the whole template.
    it('INVALID: {a template whose substitution cannot produce a representative value} => false', () => {
      expect(
        isTypeFillableGuard({ type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [CALLABLE] }) }),
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

    // `null` passes every SCALAR kind whatever the declared type spells: the hermetic walk's checker has
    // no strict-null-checks config, so it already treats `null` as assignable everywhere and a nullable
    // union arrives here with `null` already gone from `type` — never from the value it can hold.
    it('VALID: {boolean type, a null candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'boolean' }, value: representativeValueContract.parse(null) })).toBe(true);
    });

    it('VALID: {string type, a null candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'string' }, value: representativeValueContract.parse(null) })).toBe(true);
    });

    it('VALID: {number type, a null candidate} => true', () => {
      expect(isTypeFillableGuard({ type: { kind: 'number' }, value: representativeValueContract.parse(null) })).toBe(true);
    });

    it('VALID: {a literal type, a null candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          value: representativeValueContract.parse(null),
        }),
      ).toBe(true);
    });

    it('VALID: {a union of scalars, a null candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
          value: representativeValueContract.parse(null),
        }),
      ).toBe(true);
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

    // WITH a candidate, only the SHAPE matters: the value must be a string, or `null` under the same
    // rule every scalar-admitting kind gives it. The declared PATTERN is not re-validated, the same
    // latitude a `literal` type gives a supplied string's own spelling.
    it('VALID: {a template type, a string candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
          value: representativeValueContract.parse('id-abc123'),
        }),
      ).toBe(true);
    });

    it('VALID: {a template type, a null candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
          value: representativeValueContract.parse(null),
        }),
      ).toBe(true);
    });

    it('INVALID: {a template type, a number candidate} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
          value: representativeValueContract.parse(7),
        }),
      ).toBe(false);
    });
  });

  // A COMPOSITE candidate — the recursive `ArrangeValue` shape an `array`/`object` binding carries, not
  // just the scalar `RepresentativeValue` leaf. This is the general form: a producer that builds a
  // binding by hand (not through the fill seam) can still disagree with the declared type, and this
  // arity is what a caller checks it against.
  describe('a composite candidate', () => {
    it('VALID: {number[], a matching array candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          value: arrangeValueContract.parse([1, 2, 3]),
        }),
      ).toBe(true);
    });

    it('INVALID: {number[], a string in the array} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          value: arrangeValueContract.parse([1, 'x', 3]),
        }),
      ).toBe(false);
    });

    it('INVALID: {number[], a scalar candidate rather than an array} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          value: representativeValueContract.parse(7),
        }),
      ).toBe(false);
    });

    it('VALID: {number[][], a nested array candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'array', element: { kind: 'number' } } }),
          value: arrangeValueContract.parse([[1, 2], [3]]),
        }),
      ).toBe(true);
    });

    it('EMPTY: {number[], an empty array candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          value: arrangeValueContract.parse([]),
        }),
      ).toBe(true);
    });

    it('VALID: {a tuple type, a matching array candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
          value: arrangeValueContract.parse(['abc123', 7]),
        }),
      ).toBe(true);
    });

    // Fixed-length: a candidate array of the wrong length is not a value of the tuple, however
    // fillable each position it does have is.
    it('INVALID: {a tuple type, a candidate array of the wrong length} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
          value: arrangeValueContract.parse(['abc123']),
        }),
      ).toBe(false);
    });

    // HETEROGENEOUS: each position is checked against its OWN type, never one shared element type.
    it('INVALID: {a tuple type, a candidate array with a wrong element type at one position} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
          value: arrangeValueContract.parse(['abc123', 'not-a-number']),
        }),
      ).toBe(false);
    });

    it('INVALID: {a tuple type, an object candidate rather than an array} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }] }),
          value: arrangeValueContract.parse({ host: 'abc123' }),
        }),
      ).toBe(false);
    });

    it('EMPTY: {an empty tuple, an empty array candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'tuple', elements: [] }),
          value: arrangeValueContract.parse([]),
        }),
      ).toBe(true);
    });

    it('VALID: {an object type, a matching object candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          value: arrangeValueContract.parse({ host: 'abc123' }),
        }),
      ).toBe(true);
    });

    it('INVALID: {an object type, a required property holding the wrong type} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          value: arrangeValueContract.parse({ host: 7 }),
        }),
      ).toBe(false);
    });

    it('INVALID: {an object type, a required property MISSING from the candidate} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          value: arrangeValueContract.parse({}),
        }),
      ).toBe(false);
    });

    it('VALID: {an object type, an OPTIONAL property absent from the candidate} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Db',
            properties: [{ name: 'host', type: { kind: 'string' }, optional: true }],
          }),
          value: arrangeValueContract.parse({}),
        }),
      ).toBe(true);
    });

    it('INVALID: {an object type, an array candidate rather than an object} => false', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          value: arrangeValueContract.parse(['abc123']),
        }),
      ).toBe(false);
    });

    it('VALID: {an object property nested inside an array element} => true', () => {
      expect(
        isTypeFillableGuard({
          type: TypeDescriptorStub({
            kind: 'array',
            element: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
          }),
          value: arrangeValueContract.parse([{ host: 'abc123' }, { host: 'def456' }]),
        }),
      ).toBe(true);
    });
  });
});
