import { typeFactContract } from './type-fact-contract';
import { TypeFactStub } from './type-fact.stub';

describe('typeFactContract', () => {
  describe('valid type facts', () => {
    it('VALID: {flavor: "string"} => parses the string fact', () => {
      const fact = TypeFactStub();

      const result = typeFactContract.parse(fact);

      expect(result).toStrictEqual({ flavor: 'string' });
    });

    it('VALID: {flavor: "union", members} => parses nested literal members with text', () => {
      const result = typeFactContract.parse({
        flavor: 'union',
        members: [
          { flavor: 'literal', value: 'a' },
          { flavor: 'literal', value: 'b' },
        ],
        text: '"a" | "b"',
      });

      expect(result).toStrictEqual({
        flavor: 'union',
        members: [
          { flavor: 'literal', value: 'a' },
          { flavor: 'literal', value: 'b' },
        ],
        text: '"a" | "b"',
      });
    });

    it('VALID: {flavor: "array", element} => parses the element fact', () => {
      const result = typeFactContract.parse({ flavor: 'array', element: { flavor: 'number' } });

      expect(result).toStrictEqual({ flavor: 'array', element: { flavor: 'number' } });
    });

    it('VALID: {flavor: "tuple", elements} => parses one fact per fixed position', () => {
      const result = typeFactContract.parse({
        flavor: 'tuple',
        elements: [{ flavor: 'string' }, { flavor: 'number' }],
      });

      expect(result).toStrictEqual({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] });
    });

    it('VALID: {flavor: "template", texts, types} => parses the literal segments and the substitution facts', () => {
      const result = typeFactContract.parse({
        flavor: 'template',
        texts: ['id-', ''],
        types: [{ flavor: 'string' }],
      });

      expect(result).toStrictEqual({ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] });
    });

    it('VALID: {flavor: "object", typeName, properties} => parses the named property list', () => {
      const result = typeFactContract.parse({
        flavor: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', fact: { flavor: 'string' } },
          { name: 'retries', fact: { flavor: 'number' } },
        ],
      });

      expect(result).toStrictEqual({
        flavor: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', fact: { flavor: 'string' } },
          { name: 'retries', fact: { flavor: 'number' } },
        ],
      });
    });

    it('VALID: {flavor: "callable", text} => parses the callable fact carrying its signature text', () => {
      const result = typeFactContract.parse({ flavor: 'callable', text: '(message: string) => string' });

      expect(result).toStrictEqual({ flavor: 'callable', text: '(message: string) => string' });
    });

    it('VALID: {flavor: "object", no typeName} => parses a keyless anonymous object', () => {
      const result = typeFactContract.parse({
        flavor: 'object',
        properties: [{ name: 'a', fact: { flavor: 'string' } }],
      });

      expect(result).toStrictEqual({ flavor: 'object', properties: [{ name: 'a', fact: { flavor: 'string' } }] });
    });

    it('VALID: {flavor: "boolean"} => parses the boolean fact', () => {
      const result = typeFactContract.parse({ flavor: 'boolean' });

      expect(result).toStrictEqual({ flavor: 'boolean' });
    });

    it('VALID: {flavor: "number"} => parses the number fact', () => {
      const result = typeFactContract.parse({ flavor: 'number' });

      expect(result).toStrictEqual({ flavor: 'number' });
    });

    it('VALID: {flavor: "literal", value: "a"} => parses a string literal', () => {
      const result = typeFactContract.parse({ flavor: 'literal', value: 'a' });

      expect(result).toStrictEqual({ flavor: 'literal', value: 'a' });
    });

    it('VALID: {flavor: "literal", value: 7} => parses a number literal', () => {
      const result = typeFactContract.parse({ flavor: 'literal', value: 7 });

      expect(result).toStrictEqual({ flavor: 'literal', value: 7 });
    });

    it('VALID: {flavor: "literal", value: true} => parses a boolean literal', () => {
      const result = typeFactContract.parse({ flavor: 'literal', value: true });

      expect(result).toStrictEqual({ flavor: 'literal', value: true });
    });

    it('VALID: {flavor: "literal", value: null} => parses a null literal', () => {
      const result = typeFactContract.parse({ flavor: 'literal', value: null });

      expect(result).toStrictEqual({ flavor: 'literal', value: null });
    });

    // `typeRef`/`typeArgs` are the foreign key a consume-time overlay resolves the real declaration by
    // — present only when the opaque type was written as a plain reference (`config: Box<string>`).
    it('VALID: {flavor: "other", typeRef, typeArgs} => parses the opaque type carrying its resolvable reference', () => {
      const result = typeFactContract.parse({
        flavor: 'other',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ flavor: 'string' }],
      });

      expect(result).toStrictEqual({
        flavor: 'other',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ flavor: 'string' }],
      });
    });

    it('VALID: {flavor: "other", no typeRef} => parses an opaque type the declaration spelled as no plain reference', () => {
      const result = typeFactContract.parse({ flavor: 'other', text: 'Db | string' });

      expect(result).toStrictEqual({ flavor: 'other', text: 'Db | string' });
    });

    // `truncated` marks where the reader stopped re-entering a type already on its own path
    // (`interface Tree { next: Tree }`) — the empty property list is where the read ended, not the
    // type's declaration.
    it('VALID: {flavor: "object", truncated: true} => parses a self-referential type stopped mid-read', () => {
      const result = typeFactContract.parse({ flavor: 'object', typeName: 'Tree', truncated: true, properties: [] });

      expect(result).toStrictEqual({ flavor: 'object', typeName: 'Tree', truncated: true, properties: [] });
    });

    it('VALID: {flavor: "object", a property marked optional} => carries the property optional flag', () => {
      const result = typeFactContract.parse({
        flavor: 'object',
        properties: [{ name: 'a', fact: { flavor: 'string' }, optional: true }],
      });

      expect(result).toStrictEqual({
        flavor: 'object',
        properties: [{ name: 'a', fact: { flavor: 'string' }, optional: true }],
      });
    });
  });

  describe('invalid type facts', () => {
    it('INVALID: {flavor: "nonsense"} => throws validation error', () => {
      expect(() => {
        return typeFactContract.parse({ flavor: 'nonsense' });
      }).toThrow(/Invalid discriminator/u);
    });

    it('INVALID: {flavor: "tuple", no elements} => throws validation error', () => {
      expect(() => {
        return typeFactContract.parse({ flavor: 'tuple' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {flavor: "other", no text} => throws validation error', () => {
      expect(() => {
        return typeFactContract.parse({ flavor: 'other', typeRef: 'Config' });
      }).toThrow(/Required/u);
    });
  });
});
