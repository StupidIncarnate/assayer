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
  });

  describe('invalid type facts', () => {
    it('INVALID: {flavor: "tuple"} => throws validation error', () => {
      expect(() => {
        return typeFactContract.parse({ flavor: 'tuple' });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
