import { harnessModuleStatics } from './harness-module-statics';

describe('harnessModuleStatics', () => {
  describe('the fixed spellings the artifact is written in', () => {
    it('VALID: {the statics} => names the package, the registrar, the file suffix, and the key path halves', () => {
      expect(harnessModuleStatics).toStrictEqual({
        packageName: '@assayer/core',
        registrar: 'assayerHarness',
        fileSuffix: '.harness.ts',
        inputsRoot: 'inputs',
        keySeparator: '.',
      });
    });
  });
});
