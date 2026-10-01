import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { typeofTagTransformer } from './typeof-tag-transformer';

describe('typeofTagTransformer', () => {
  describe('scalar kinds', () => {
    it("VALID: {string} => 'string'", () => {
      expect(typeofTagTransformer({ type: { kind: 'string' } })).toBe('string');
    });

    it("VALID: {number} => 'number'", () => {
      expect(typeofTagTransformer({ type: { kind: 'number' } })).toBe('number');
    });

    it("VALID: {boolean} => 'boolean'", () => {
      expect(typeofTagTransformer({ type: { kind: 'boolean' } })).toBe('boolean');
    });

    // A template literal type is still, at runtime, a plain string.
    it("VALID: {template} => 'string'", () => {
      expect(
        typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }) }),
      ).toBe('string');
    });
  });

  describe('literal kinds', () => {
    it("VALID: {literal string} => 'string'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 'a' }) })).toBe('string');
    });

    it("VALID: {literal number} => 'number'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 7 }) })).toBe('number');
    });

    it("VALID: {literal boolean} => 'boolean'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: true }) })).toBe('boolean');
    });

    // `typeof null === 'object'` in JavaScript. This reads the fact off the literal's own extracted
    // VALUE, never off any spelling.
    it("VALID: {literal null} => 'object', the real typeof operator's own wart", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: null }) })).toBe('object');
    });
  });

  describe('shape kinds', () => {
    it("VALID: {object} => 'object'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'object', properties: [] }) })).toBe('object');
    });

    it("VALID: {array} => 'object', since typeof does not distinguish an array from a plain object", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } }) })).toBe('object');
    });

    it("VALID: {tuple} => 'object'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }] }) })).toBe('object');
    });

    it("VALID: {callable} => 'function'", () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'callable', text: '() => void' }) })).toBe('function');
    });
  });

  describe('indeterminate kinds', () => {
    // A union has no tag of its own — its members do, read one at a time by `typeofDomainTransformer`.
    it('EMPTY: {union} => undefined, since a union has no single tag', () => {
      expect(
        typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }) }),
      ).toBe(undefined);
    });

    it('EMPTY: {unknown} => undefined, since the analyzer never resolved its runtime shape', () => {
      expect(typeofTagTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' }) })).toBe(undefined);
    });
  });
});
