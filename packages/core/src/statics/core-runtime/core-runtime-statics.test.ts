import { coreRuntimeStatics } from './core-runtime-statics';

describe('coreRuntimeStatics', () => {
  describe('the file names of core\'s run-time modules', () => {
    it('VALID: {the statics} => names the trees, the dist folder, the Jest global, the ceremony files, the modules, the source conditions, the module formats and the runner settings', () => {
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
          compiler: 'bundled-typescript.js',
          resolver: 'ts-resolver.js',
          runner: 'run-jest.js',
        },
        modules: {
          interpretCase: 'src/brokers/case/interpret/case-interpret-broker',
          resolveEntry: 'src/brokers/case/resolve-entry/case-resolve-entry-broker',
          probeRuntime: 'src/brokers/probe-runtime/create/probe-runtime-create-broker',
          probeInject: 'src/transformers/probe-inject/probe-inject-transformer',
          harness: 'index',
        },
        sourceExportConditions: ['source', 'node', 'node-addons'],
        moduleFormats: ['commonjs', 'esm'],
        shimFile: {
          commonjs: 'assayer.test.cjs',
          esm: 'assayer.test.mjs',
        },
        esmExtensions: ['.ts', '.tsx'],
        tsJestCompilerOptions: {
          commonjs: {
            module: 'commonjs',
          },
          esm: {
            module: 'esnext',
            esModuleInterop: true,
          },
        },
        workerExecArgv: ['--experimental-vm-modules', '--no-warnings=ExperimentalWarning'],
      });
    });
  });
});
