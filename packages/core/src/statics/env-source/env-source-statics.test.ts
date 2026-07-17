import { envSourceStatics } from './env-source-statics';

describe('envSourceStatics', () => {
  describe('the shape it names', () => {
    // Pinned as a whole rather than per key: these four are ONE fact — the expression
    // `Number(process.env.X)` — and a test that checked them one at a time could not notice a fifth
    // key arriving with no inverse to go with it.
    it('VALID: {the recognized env source} => process.env read through the Number coercion', () => {
      expect(envSourceStatics).toStrictEqual({
        global: 'process',
        property: 'env',
        coercion: 'Number',
      });
    });
  });
});
