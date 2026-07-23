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

    it('VALID: {flavor: "object", no typeName} => parses a keyless anonymous object', () => {
      const result = typeFactContract.parse({
        flavor: 'object',
        properties: [{ name: 'a', fact: { flavor: 'string' } }],
      });

      expect(result).toStrictEqual({ flavor: 'object', properties: [{ name: 'a', fact: { flavor: 'string' } }] });
    });
  });

  describe('invalid type facts', () => {
    it('INVALID: {flavor: "tuple"} => throws validation error', () => {
      expect(() => {
        return typeFactContract.parse({ flavor: 'tuple' });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
