import { observeStatics } from './observe-statics';

describe('observeStatics', () => {
  describe('settings', () => {
    it('VALID: {statics} => holds the cache settings and the path to core', () => {
      expect(observeStatics).toStrictEqual({
        cache: {
          dirPrefix: 'assayer-specimen-observe-',
          analyzerContentHash: 'specimen-generator-pinned-hash',
        },
        corePathSegments: ['..', '..', '..', '..', '..', 'core'],
      });
    });
  });
});
