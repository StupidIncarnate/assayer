import { coreRuntimeStatics } from './core-runtime-statics';

describe('coreRuntimeStatics', () => {
  describe('the file names of core\'s run-time modules', () => {
    it('VALID: {the statics} => names the trees, the dist folder, the Jest global, the ceremony files, the modules and the source conditions', () => {
      expect(coreRuntimeStatics).toStrictEqual({
        trees: ['source', 'dist'],
        layout: {
          distFolder: 'dist',
        },
        jestGlobal: {
          name: '__assayerCoreRuntime',
        },
        ceremony: {
          setupFile: 'probe-runtime.js',
          astTransformer: 'probe-transformer.js',
          registrar: 'harness-registrar.js',
        },
        modules: {
          interpretCase: 'src/adapters/jest/interpret-case/jest-interpret-case-adapter',
          resolveEntry: 'src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
          probeRuntime: 'src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
          probeInject: 'src/adapters/jest/probe-inject/jest-probe-inject-adapter',
          harness: 'index',
        },
        sourceExportConditions: ['source', 'node', 'node-addons'],
      });
    });
  });
});
