import { envStubContract } from './env-stub-contract';
import { EnvStubStub } from './env-stub.stub';

describe('envStubContract', () => {
  describe('valid env stubs', () => {
    it('VALID: {stub default} => carries its key, property, guessed values, guessed flag, and readers', () => {
      const result = envStubContract.parse(EnvStubStub());

      expect(result).toStrictEqual({
        key: 'process.env#MODE',
        property: 'MODE',
        values: ['production'],
        guessed: true,
        readers: ['src/config/config.ts'],
      });
    });
  });

  describe('invalid env stubs', () => {
    it('EMPTY: {no property} => throws validation error', () => {
      expect(() => {
        return envStubContract.parse({ key: 'process.env#MODE', values: [], guessed: true, readers: [] });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {no readers} => throws validation error', () => {
      expect(() => {
        return envStubContract.parse({ key: 'process.env#MODE', property: 'MODE', values: [], guessed: true });
      }).toThrow(/Required/u);
    });
  });
});
