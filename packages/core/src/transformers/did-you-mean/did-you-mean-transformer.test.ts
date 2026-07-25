import { SymbolNameStub } from '@assayer/shared/contracts';

import { didYouMeanTransformer } from './did-you-mean-transformer';

const CANDIDATES = [
  SymbolNameStub({ value: 'audit' }),
  SymbolNameStub({ value: 'collect' }),
  SymbolNameStub({ value: 'report' }),
];

describe('didYouMeanTransformer', () => {
  describe('suggesting the closest candidate', () => {
    it('VALID: {a one-character typo} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: SymbolNameStub({ value: 'audot' }), candidates: CANDIDATES });

      expect(result).toBe('audit');
    });

    it('VALID: {a transposition} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: SymbolNameStub({ value: 'cllocet' }), candidates: CANDIDATES });

      expect(result).toBe('collect');
    });

    it('VALID: {a case slip} => suggests the intended name', () => {
      const result = didYouMeanTransformer({ name: SymbolNameStub({ value: 'Report' }), candidates: CANDIDATES });

      expect(result).toBe('report');
    });

    it('VALID: {an exact match} => suggests that same name', () => {
      const result = didYouMeanTransformer({ name: SymbolNameStub({ value: 'collect' }), candidates: CANDIDATES });

      expect(result).toBe('collect');
    });

    it('EDGE: {two candidates equally far away} => suggests the alphabetically first (determinism)', () => {
      const result = didYouMeanTransformer({
        name: SymbolNameStub({ value: 'x' }),
        candidates: [SymbolNameStub({ value: 'zb' }), SymbolNameStub({ value: 'za' })],
      });

      expect(result).toBe('za');
    });

    it('EMPTY: {no candidates} => suggests nothing', () => {
      const result = didYouMeanTransformer({ name: SymbolNameStub({ value: 'audit' }), candidates: [] });

      expect(result).toBe(undefined);
    });
  });
});
