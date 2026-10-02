import { consumerProjectStatics } from './consumer-project-statics';

describe('consumerProjectStatics', () => {
  describe('the defaults a consumer-rooted project falls back to', () => {
    it('VALID: {the statics} => defaults types to every @types package', () => {
      expect(consumerProjectStatics).toStrictEqual({
        defaultCompilerOptions: {
          types: ['*'],
        },
      });
    });
  });
});
