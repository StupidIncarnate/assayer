import { typeInfoContract } from './type-info-contract';
import { TypeInfoStub } from './type-info.stub';

describe('typeInfoContract', () => {
  describe('valid type info', () => {
    it('VALID: {stub default} => parses the number info', () => {
      const typeInfo = TypeInfoStub();

      const result = typeInfoContract.parse(typeInfo);

      expect(result).toStrictEqual({
        known: 3,
        samples: [10, 20, 30],
        env: 'Number(process.env.KEY)',
        external: 'Number(process.argv[2])',
      });
    });

    it('EMPTY: {samples: []} => parses, since a type may list no samples', () => {
      const typeInfo = TypeInfoStub({ samples: [] });

      const result = typeInfoContract.parse(typeInfo);

      expect(result).toStrictEqual({
        known: 3,
        samples: [],
        env: 'Number(process.env.KEY)',
        external: 'Number(process.argv[2])',
      });
    });
  });

  describe('invalid type info', () => {
    it('INVALID: {env: ""} => throws, since an env leaf needs text to write', () => {
      expect(() => {
        return typeInfoContract.parse({ ...TypeInfoStub(), env: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {external: missing} => throws, since an external leaf needs text to write', () => {
      expect(() => {
        return typeInfoContract.parse({ known: 3, samples: [], env: 'x' });
      }).toThrow(/expected string, received undefined/u);
    });
  });
});
