
import { didYouMeanTransformer } from './did-you-mean-transformer';

const CANDIDATES = [
  'audit',
  'collect',
  'report',
];

describe('didYouMeanTransformer', () => {
  describe('suggesting the closest candidate', () => {
    it('VALID: {a one-character typo} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: 'audot', candidates: CANDIDATES });

      expect(result).toBe('audit');
    });

    it('VALID: {a transposition} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: 'cllocet', candidates: CANDIDATES });

      expect(result).toBe('collect');
    });

    it('VALID: {a case slip} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: 'Report', candidates: CANDIDATES });

      expect(result).toBe('report');
    });

    it('VALID: {an exact match} => suggests that same name', () => {
      const result = didYouMeanTransformer({ name: 'collect', candidates: CANDIDATES });

      expect(result).toBe('collect');
    });

    it('EDGE: {two candidates equally far away} => suggests the alphabetically first (determinism)', () => {
      const result = didYouMeanTransformer({
        name: 'x',
        candidates: ['zb', 'za'],
      });

      expect(result).toBe('za');
    });

    it('EMPTY: {no candidates} => suggests nothing', () => {
      const result = didYouMeanTransformer({ name: 'audit', candidates: [] });

      expect(result).toBe(undefined);
    });
  });
});
