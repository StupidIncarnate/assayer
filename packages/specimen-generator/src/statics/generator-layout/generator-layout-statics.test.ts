import { generatorLayoutStatics } from './generator-layout-statics';

describe('generatorLayoutStatics', () => {
  describe('layout', () => {
    it('VALID: {statics} => holds the declaration and output layout', () => {
      expect(generatorLayoutStatics).toStrictEqual({
        declarations: {
          folder: 'declarations',
          kitSpecifier: '../kit',
          tsconfigFile: 'tsconfig.json',
          containers: { folder: 'containers', suffix: '.container.ts' },
          syntax: { folder: 'syntax', suffix: '.syntax.ts' },
          shims: { folder: 'shims', suffix: '.shim.ts' },
        },
        output: {
          rootSegments: ['smoke-repo', 'packages', 'syntax-repository'],
          sourceFolder: 'src',
          manifestFile: 'specimen-manifest.json',
          refusalsFile: 'REFUSED.md',
          specimenSuffix: '.ts',
          testSuffix: '.test.ts',
          testRelPathPrefix: 'packages/syntax-repository/src',
        },
      });
    });
  });
});
