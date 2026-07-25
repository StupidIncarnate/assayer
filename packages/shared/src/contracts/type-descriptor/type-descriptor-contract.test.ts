import { typeDescriptorContract } from './type-descriptor-contract';
import { TypeDescriptorStub } from './type-descriptor.stub';

describe('typeDescriptorContract', () => {
  describe('valid type descriptors', () => {
    it('VALID: {kind: "string"} => parses the string descriptor', () => {
      const descriptor = TypeDescriptorStub();

      const result = typeDescriptorContract.parse(descriptor);

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {kind: "union", members} => parses nested literal members', () => {
      const result = typeDescriptorContract.parse({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'a' },
          { kind: 'literal', value: 'b' },
        ],
      });

      expect(result).toStrictEqual({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'a' },
          { kind: 'literal', value: 'b' },
        ],
      });
    });

    it('VALID: {kind: "array", element} => parses the element descriptor', () => {
      const result = typeDescriptorContract.parse({ kind: 'array', element: { kind: 'number' } });

      expect(result).toStrictEqual({ kind: 'array', element: { kind: 'number' } });
    });

    it('VALID: {kind: "object", typeName, properties} => parses the named property list', () => {
      const result = typeDescriptorContract.parse({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      });
    });

    it('VALID: {kind: "callable", text} => parses the callable descriptor carrying its signature text', () => {
      const result = typeDescriptorContract.parse({ kind: 'callable', text: '(message: string) => string' });

      expect(result).toStrictEqual({ kind: 'callable', text: '(message: string) => string' });
    });

    it('VALID: {kind: "object", no typeName} => parses a keyless anonymous object', () => {
      const result = typeDescriptorContract.parse({
        kind: 'object',
        properties: [{ name: 'a', type: { kind: 'string' } }],
      });

      expect(result).toStrictEqual({
        kind: 'object',
        properties: [{ name: 'a', type: { kind: 'string' } }],
      });
    });

    it('VALID: {kind: "number"} => parses the number descriptor', () => {
      const result = typeDescriptorContract.parse({ kind: 'number' });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {kind: "boolean"} => parses the boolean descriptor', () => {
      const result = typeDescriptorContract.parse({ kind: 'boolean' });

      expect(result).toStrictEqual({ kind: 'boolean' });
    });

    it('VALID: {kind: "literal", value} => parses a literal descriptor at the top level', () => {
      const result = typeDescriptorContract.parse({ kind: 'literal', value: 'active' });

      expect(result).toStrictEqual({ kind: 'literal', value: 'active' });
    });

    it('VALID: {kind: "array", cardinality} => parses the known element count', () => {
      const result = typeDescriptorContract.parse({ kind: 'array', element: { kind: 'number' }, cardinality: 3 });

      expect(result).toStrictEqual({ kind: 'array', element: { kind: 'number' }, cardinality: 3 });
    });

    // `truncated` says the reader STOPPED because the type re-entered its own path — the empty
    // property list is where the read ended, not what the type declares.
    it('VALID: {kind: "object", truncated: true} => parses a self-referential shape where the reader stopped', () => {
      const result = typeDescriptorContract.parse({ kind: 'object', typeName: 'Tree', truncated: true, properties: [] });

      expect(result).toStrictEqual({ kind: 'object', typeName: 'Tree', truncated: true, properties: [] });
    });

    it('VALID: {kind: "object", a property marked optional} => carries the property-level optional flag', () => {
      const result = typeDescriptorContract.parse({
        kind: 'object',
        properties: [{ name: 'child', type: { kind: 'string' }, optional: true }],
      });

      expect(result).toStrictEqual({
        kind: 'object',
        properties: [{ name: 'child', type: { kind: 'string' }, optional: true }],
      });
    });

    it('VALID: {kind: "unknown", text} => parses an opaque type carrying only its display text', () => {
      const result = typeDescriptorContract.parse({ kind: 'unknown', text: 'Date' });

      expect(result).toStrictEqual({ kind: 'unknown', text: 'Date' });
    });

    it('VALID: {kind: "unknown", typeRef} => carries the reference name a consume-time overlay resolves by', () => {
      const result = typeDescriptorContract.parse({ kind: 'unknown', text: 'Config', typeRef: 'Config' });

      expect(result).toStrictEqual({ kind: 'unknown', text: 'Config', typeRef: 'Config' });
    });

    it('VALID: {kind: "unknown", typeRef, typeArgs} => carries the type arguments a generic reference names, in order', () => {
      const result = typeDescriptorContract.parse({
        kind: 'unknown',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ kind: 'string' }],
      });

      expect(result).toStrictEqual({
        kind: 'unknown',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ kind: 'string' }],
      });
    });
  });

  describe('invalid type descriptors', () => {
    it('INVALID: {kind: "tuple"} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'tuple' });
      }).toThrow(/Invalid discriminator/u);
    });

    it('INVALID: {kind: "literal", no value} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'literal' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {kind: "array", no element} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'array' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {kind: "object", no properties} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'object' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {kind: "unknown", no text} => throws validation error', () => {
      expect(() => {
        return typeDescriptorContract.parse({ kind: 'unknown' });
      }).toThrow(/Required/u);
    });
  });
});
