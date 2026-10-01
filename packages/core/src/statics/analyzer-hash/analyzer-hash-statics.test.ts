import { analyzerHashStatics } from './analyzer-hash-statics';

describe('analyzerHashStatics', () => {
  describe('the file-name rules of the analyzer hash', () => {
    it('VALID: {the statics} => names the source tree exclusions and the dist code extension', () => {
      expect(analyzerHashStatics).toStrictEqual({
        source: {
          testSupportInfixes: ['.proxy.', '.stub.'],
          declarationSuffix: '.d.ts',
          scratchFolders: ['.test-tmp', '_lint-testbed'],
        },
        dist: {
          codeExtension: '.js',
        },
      });
    });
  });
});
