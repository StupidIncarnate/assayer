import { envSourceStatics } from './env-source-statics';

describe('envSourceStatics', () => {
  describe('the shape it names', () => {
    // Pinned as a whole rather than per key: every name here needs an inverse in `env-encode`, and a
    // test that checked them one at a time could not notice a new key arriving without one.
    it('VALID: {the recognized env source} => process.env, the Number, split and map steps, the split fillers, and the argv read', () => {
      expect(envSourceStatics).toStrictEqual({
        global: 'process',
        property: 'env',
        coercion: 'Number',
        methods: {
          split: 'split',
          map: 'map',
        },
        fillers: ['a', 'b', 'c'],
        argv: {
          property: 'argv',
          slice: 'slice',
          runnerLength: 2,
        },
      });
    });
  });
});
