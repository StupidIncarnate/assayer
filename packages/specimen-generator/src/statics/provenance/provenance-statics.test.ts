import { provenanceStatics } from './provenance-statics';

describe('provenanceStatics', () => {
  describe('table', () => {
    it('VALID: {statics} => holds how each provenance is tested and offered', () => {
      expect(provenanceStatics).toStrictEqual({
        param: { test: 'sets', offered: 'params' },
        env: { test: 'sets', offered: 'module-load' },
        literal: { test: 'known', offered: 'always' },
        const: { test: 'known', offered: 'always' },
        random: { test: 'pinned', offered: 'always' },
        external: { test: 'unsettable', offered: 'always' },
      });
    });
  });
});
