import { typeListStatics } from '../../statics/type-list/type-list-statics';
import { typeInfoTransformer } from './type-info-transformer';

describe('typeInfoTransformer', () => {
  describe('base types', () => {
    it.each(Object.entries(typeListStatics))(
      'VALID: {typeText: %s} => returns the known value, samples, env and external text of the base type',
      (typeText, base) => {
        const result = typeInfoTransformer({ typeText });

        expect(result).toStrictEqual({
          known: base.known,
          samples: Object.values(base.samples),
          env: base.env,
          external: base.external,
        });
      },
    );

    it('VALID: {typeText: "number"} => returns the number info', () => {
      const result = typeInfoTransformer({ typeText: 'number' });

      expect(result).toStrictEqual({
        known: 3,
        samples: [10, 20, 30],
        env: 'Number(process.env.KEY)',
        external: 'Number(process.argv[2])',
      });
    });
  });

  describe('readonly arrays', () => {
    it('VALID: {typeText: "readonly number[]"} => returns the samples as the known value and the array reads', () => {
      const result = typeInfoTransformer({ typeText: 'readonly number[]' });

      expect(result).toStrictEqual({
        known: [10, 20, 30],
        samples: [[10, 20, 30]],
        env: "(process.env.KEY ?? '').split(',').map(Number)",
        external: 'process.argv.slice(2).map(Number)',
      });
    });

    it('VALID: {typeText: "readonly string[]"} => returns the string array reads', () => {
      const result = typeInfoTransformer({ typeText: 'readonly string[]' });

      expect(result).toStrictEqual({
        known: ['a', 'b', 'c'],
        samples: [['a', 'b', 'c']],
        env: "(process.env.KEY ?? '').split(',')",
        external: 'process.argv.slice(2)',
      });
    });
  });

  describe('optional types', () => {
    it('VALID: {typeText: "number | undefined"} => returns the base known value with reads that may give undefined', () => {
      const result = typeInfoTransformer({ typeText: 'number | undefined' });

      expect(result).toStrictEqual({
        known: 3,
        samples: [10, 20, 30],
        env: 'process.env.KEY === undefined ? undefined : Number(process.env.KEY)',
        external: 'process.argv[2] === undefined ? undefined : Number(process.argv[2])',
      });
    });
  });

  describe('unknown types', () => {
    it('ERROR: {typeText: "Date"} => throws naming the type and the types it knows', () => {
      expect(() => {
        return typeInfoTransformer({ typeText: 'Date' });
      }).toThrow(
        /^Type 'Date' is not a type the generator knows\. It knows number, string, boolean, and `readonly X\[\]` and `X \| undefined` for each of them\. Add the base type to typeListStatics, or change the hole's type\.$/u,
      );
    });

    it('ERROR: {typeText: "readonly Date[]"} => throws naming the whole type text', () => {
      expect(() => {
        return typeInfoTransformer({ typeText: 'readonly Date[]' });
      }).toThrow(/^Type 'readonly Date\[\]' is not a type the generator knows\./u);
    });
  });
});
