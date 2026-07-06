import { docsCatalogStatics } from './docs-catalog-statics';

describe('docsCatalogStatics', () => {
  describe('topics', () => {
    it('VALID: topics => exposes the overview and plugins topic keys in order', () => {
      const keys = docsCatalogStatics.topics.map((entry) => entry.key);

      expect(keys).toStrictEqual(['overview', 'plugins']);
    });
  });
});
