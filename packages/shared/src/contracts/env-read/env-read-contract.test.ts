import { envReadContract } from './env-read-contract';
import { EnvReadStub } from './env-read.stub';

describe('envReadContract', () => {
  describe('valid env reads', () => {
    it('VALID: {stub default} => carries its property and compared literals', () => {
      const result = envReadContract.parse(EnvReadStub());

      expect(result).toStrictEqual({ property: 'MODE', literals: ['production'] });
    });

    it('VALID: {a read with no direct comparison} => empty literals, still names the property', () => {
      const result = envReadContract.parse(EnvReadStub({ property: 'CODE', literals: [] }));

      expect(result).toStrictEqual({ property: 'CODE', literals: [] });
    });
  });

  describe('invalid env reads', () => {
    it('EMPTY: {no property} => throws validation error', () => {
      expect(() => {
        return envReadContract.parse({ literals: [] });
      }).toThrow(/Required/u);
    });
  });
});
