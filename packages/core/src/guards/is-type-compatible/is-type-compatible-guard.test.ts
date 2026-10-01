import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { isTypeCompatibleGuard } from './is-type-compatible-guard';

const CALLABLE_DECLARED = TypeDescriptorStub({ kind: 'callable', text: '(m: string) => void' });
const CALLABLE_SUPPLIED = TypeDescriptorStub({ kind: 'callable', text: '(n: number) => string' });
const UNDEFINED_SUPPLIED = TypeDescriptorStub({ kind: 'unknown', text: 'undefined' });
const OPAQUE_DECLARED = TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' });

describe('isTypeCompatibleGuard', () => {
  describe('a scalar declared type', () => {
    it('VALID: {string declared, a string supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'string' }, supplied: { kind: 'string' } })).toBe(true);
    });

    it('INVALID: {string declared, a number supplied} => false', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'string' }, supplied: { kind: 'number' } })).toBe(false);
    });

    it('VALID: {number declared, a number supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'number' }, supplied: { kind: 'number' } })).toBe(true);
    });

    it('VALID: {boolean declared, a boolean supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'boolean' }, supplied: { kind: 'boolean' } })).toBe(true);
    });

    // The checker hands back a harness's own literal expression at its PRECISE type — `'a'`, never
    // widened to `string` — even one property inside an object literal, so a declared scalar has to
    // admit the matching-kind literal on sight.
    it('VALID: {string declared, a matching-kind literal supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({ declared: { kind: 'string' }, supplied: TypeDescriptorStub({ kind: 'literal', value: 'a' }) }),
      ).toBe(true);
    });

    it('VALID: {number declared, a matching-kind literal supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({ declared: { kind: 'number' }, supplied: TypeDescriptorStub({ kind: 'literal', value: 5 }) }),
      ).toBe(true);
    });

    it('VALID: {boolean declared, a matching-kind literal supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({ declared: { kind: 'boolean' }, supplied: TypeDescriptorStub({ kind: 'literal', value: true }) }),
      ).toBe(true);
    });

    it('INVALID: {string declared, a DIFFERENT-kind literal supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({ declared: { kind: 'string' }, supplied: TypeDescriptorStub({ kind: 'literal', value: 5 }) }),
      ).toBe(false);
    });
  });

  // The corner the defect is named for: `undefined` reads as opaque `unknown`, so it is compatible with
  // NOTHING except a declared type that is itself `unknown` — it fails unless the declared type admits
  // it, exactly the ruling's own words.
  describe('undefined supplied for a refused parameter', () => {
    it('INVALID: {a declared callable, undefined supplied} => false', () => {
      expect(isTypeCompatibleGuard({ declared: CALLABLE_DECLARED, supplied: UNDEFINED_SUPPLIED })).toBe(false);
    });

    it('INVALID: {a declared string, undefined supplied} => false', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'string' }, supplied: UNDEFINED_SUPPLIED })).toBe(false);
    });

    it('INVALID: {a declared object, undefined supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
          supplied: UNDEFINED_SUPPLIED,
        }),
      ).toBe(false);
    });
  });

  describe('a callable declared type', () => {
    // The named limit: `TypeDescriptor.callable` carries only rendered text, so any callable-shaped
    // supplied type satisfies a declared callable regardless of arity or parameter/return type.
    it('VALID: {a declared callable, a callable of a DIFFERENT signature} => true (the known limit)', () => {
      expect(isTypeCompatibleGuard({ declared: CALLABLE_DECLARED, supplied: CALLABLE_SUPPLIED })).toBe(true);
    });

    it('INVALID: {a declared callable, a string supplied} => false', () => {
      expect(isTypeCompatibleGuard({ declared: CALLABLE_DECLARED, supplied: { kind: 'string' } })).toBe(false);
    });

    it('INVALID: {a declared callable, an object supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: CALLABLE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'object', typeName: 'Empty', properties: [] }),
        }),
      ).toBe(false);
    });
  });

  describe('a literal declared type', () => {
    it('VALID: {a literal declared, the exact same literal supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          supplied: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
        }),
      ).toBe(true);
    });

    it('INVALID: {a literal declared, a DIFFERENT literal supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          supplied: TypeDescriptorStub({ kind: 'literal', value: 'post' }),
        }),
      ).toBe(false);
    });

    it('INVALID: {a literal declared, the same-kind primitive widened away from it} => false', () => {
      expect(
        isTypeCompatibleGuard({ declared: TypeDescriptorStub({ kind: 'literal', value: 'get' }), supplied: { kind: 'string' } }),
      ).toBe(false);
    });
  });

  describe('a template declared type', () => {
    const TEMPLATE_DECLARED = TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] });

    // The declared PATTERN is not re-checked: a supplied plain string satisfies it on sight, the same
    // latitude a declared `string` gives a supplied string's own content.
    it('VALID: {a template declared, a string supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: TEMPLATE_DECLARED, supplied: { kind: 'string' } })).toBe(true);
    });

    it('VALID: {a template declared, a template supplied} => true, whatever its own pattern', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TEMPLATE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'template', texts: ['out-', ''], types: [{ kind: 'number' }] }),
        }),
      ).toBe(true);
    });

    it('INVALID: {a template declared, a number supplied} => false', () => {
      expect(isTypeCompatibleGuard({ declared: TEMPLATE_DECLARED, supplied: { kind: 'number' } })).toBe(false);
    });

    // The literal-widening rule only admits a matching-kind SCALAR (string/number/boolean); `template`
    // is not one of those, so a literal is refused here even though it would satisfy a declared string.
    it('INVALID: {a template declared, a literal supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TEMPLATE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'literal', value: 'id-abc123' }),
        }),
      ).toBe(false);
    });
  });

  describe('an array declared type', () => {
    it('VALID: {number[] declared, number[] supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          supplied: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
        }),
      ).toBe(true);
    });

    it('INVALID: {number[] declared, string[] supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          supplied: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }),
        }),
      ).toBe(false);
    });

    it('INVALID: {an array declared, a scalar supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
          supplied: { kind: 'number' },
        }),
      ).toBe(false);
    });

    // The repro this closes: `sinks: [(message) => {}]` supplied for `sinks: ((m: string) => void)[]`.
    it('VALID: {an array of callables declared, an array of callables supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'array', element: CALLABLE_DECLARED }),
          supplied: TypeDescriptorStub({ kind: 'array', element: CALLABLE_SUPPLIED }),
        }),
      ).toBe(true);
    });

    it('INVALID: {an array of callables declared, an array of strings supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'array', element: CALLABLE_DECLARED }),
          supplied: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }),
        }),
      ).toBe(false);
    });
  });

  describe('a tuple declared type', () => {
    const TUPLE_DECLARED = TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] });

    it('VALID: {a tuple declared, a matching tuple supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TUPLE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
        }),
      ).toBe(true);
    });

    // Fixed-length: the supplied tuple must match the declared LENGTH exactly.
    it('INVALID: {a tuple declared, a supplied tuple of a DIFFERENT length} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TUPLE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }] }),
        }),
      ).toBe(false);
    });

    // HETEROGENEOUS: each position is checked against the SAME position, never against one shared
    // element type.
    it('INVALID: {a tuple declared, a supplied tuple with one position incompatible} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TUPLE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'string' }] }),
        }),
      ).toBe(false);
    });

    it('INVALID: {a tuple declared, a non-tuple supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TUPLE_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }),
        }),
      ).toBe(false);
    });

    it('EMPTY: {an empty tuple declared, an empty tuple supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'tuple', elements: [] }),
          supplied: TypeDescriptorStub({ kind: 'tuple', elements: [] }),
        }),
      ).toBe(true);
    });
  });

  describe('an object declared type', () => {
    const DB_DECLARED = TypeDescriptorStub({
      kind: 'object',
      typeName: 'Db',
      properties: [{ name: 'host', type: { kind: 'string' } }],
    });

    it('VALID: {an object declared, a matching object supplied} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: DB_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
        }),
      ).toBe(true);
    });

    it('INVALID: {an object declared, a required property of the wrong type supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: DB_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'number' } }] }),
        }),
      ).toBe(false);
    });

    it('INVALID: {an object declared, a required property MISSING from the supplied shape} => false', () => {
      expect(
        isTypeCompatibleGuard({
          declared: DB_DECLARED,
          supplied: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [] }),
        }),
      ).toBe(false);
    });

    it('VALID: {an object declared, an OPTIONAL property missing from the supplied shape} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({
            kind: 'object',
            typeName: 'Db',
            properties: [{ name: 'host', type: { kind: 'string' }, optional: true }],
          }),
          supplied: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [] }),
        }),
      ).toBe(true);
    });

    it('INVALID: {an object declared, an array supplied} => false', () => {
      expect(
        isTypeCompatibleGuard({ declared: DB_DECLARED, supplied: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }) }),
      ).toBe(false);
    });
  });

  describe('a union declared type', () => {
    it('VALID: {declared string | number, a string supplied} => true (some member admits it)', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
          supplied: { kind: 'string' },
        }),
      ).toBe(true);
    });

    it('INVALID: {declared string | number, a boolean supplied} => false (no member admits it)', () => {
      expect(
        isTypeCompatibleGuard({
          declared: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
          supplied: { kind: 'boolean' },
        }),
      ).toBe(false);
    });

    // A SUPPLIED union (e.g. a ternary) must satisfy the declared type in EVERY member it might be.
    it('VALID: {declared string, a supplied string | literal union whose every member is a string} => true', () => {
      expect(
        isTypeCompatibleGuard({
          declared: { kind: 'string' },
          supplied: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'string' }] }),
        }),
      ).toBe(true);
    });

    it('INVALID: {declared string, a supplied string | number union} => false (one member fails)', () => {
      expect(
        isTypeCompatibleGuard({
          declared: { kind: 'string' },
          supplied: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
        }),
      ).toBe(false);
    });
  });

  describe('an opaque declared type', () => {
    // Assayer never read a real shape for `Map<string, number>`, so it never contradicts a harness
    // value against it — the same reason `is-type-fillable` never builds one either.
    it('VALID: {an opaque declared type, anything supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: OPAQUE_DECLARED, supplied: { kind: 'string' } })).toBe(true);
    });

    it('VALID: {an opaque declared type, undefined supplied} => true', () => {
      expect(isTypeCompatibleGuard({ declared: OPAQUE_DECLARED, supplied: UNDEFINED_SUPPLIED })).toBe(true);
    });
  });

  describe('no type at all', () => {
    it('EMPTY: {no declared type} => false', () => {
      expect(isTypeCompatibleGuard({ supplied: { kind: 'string' } })).toBe(false);
    });

    it('EMPTY: {no supplied type} => false', () => {
      expect(isTypeCompatibleGuard({ declared: { kind: 'string' } })).toBe(false);
    });
  });
});
