import { representativeValueContract } from '@assayer/shared/contracts';

import { envGuessedValuesTransformer } from './env-guessed-values-transformer';

const rep = (value: string | number | boolean): ReturnType<typeof representativeValueContract.parse> =>
  representativeValueContract.parse(value);

describe('envGuessedValuesTransformer', () => {
  describe('numeric properties', () => {
    it('VALID: {literals [1, 2]} => the two literals plus a representative non-listed number', () => {
      expect(envGuessedValuesTransformer({ literals: [rep(1), rep(2)] })).toStrictEqual([1, 2, 7]);
    });

    it('VALID: {literals already containing 7} => the representative steps past the largest listed', () => {
      expect(envGuessedValuesTransformer({ literals: [rep(7), rep(8)] })).toStrictEqual([7, 8, 9]);
    });

    it('VALID: {repeated literals} => deduped before the representative is added', () => {
      expect(envGuessedValuesTransformer({ literals: [rep(5), rep(5)] })).toStrictEqual([5, 7]);
    });
  });

  describe('string properties', () => {
    it('VALID: {literals ["production"]} => the literal plus the string representative, sorted', () => {
      expect(envGuessedValuesTransformer({ literals: [rep('production')] })).toStrictEqual(['abc123', 'production']);
    });
  });

  describe('no compared literals', () => {
    it('EMPTY: {no literals} => just the string representative', () => {
      expect(envGuessedValuesTransformer({ literals: [] })).toStrictEqual(['abc123']);
    });
  });
});
