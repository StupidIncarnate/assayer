import { typeListStatics } from './type-list-statics';

describe('typeListStatics', () => {
  describe('base types', () => {
    it('VALID: {statics} => holds the number, string and boolean leaf values', () => {
      expect(typeListStatics).toStrictEqual({
        number: {
          known: 3,
          samples: { first: 10, second: 20, third: 30 },
          env: 'Number(process.env.KEY)',
          external: 'Number(process.argv[2])',
          externalArray: 'process.argv.slice(2).map(Number)',
        },
        string: {
          known: 'abc',
          samples: { first: 'a', second: 'b', third: 'c' },
          env: "process.env.KEY ?? ''",
          external: "process.argv[2] ?? ''",
          externalArray: 'process.argv.slice(2)',
        },
        boolean: {
          known: true,
          samples: { first: true, second: false, third: true },
          env: "process.env.KEY === 'true'",
          external: "process.argv[2] === 'yes'",
          externalArray: "process.argv.slice(2).map((arg) => arg === 'yes')",
        },
      });
    });
  });
});
