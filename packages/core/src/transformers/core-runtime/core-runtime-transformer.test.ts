import { coreRuntimeTransformer } from './core-runtime-transformer';

describe('coreRuntimeTransformer', () => {
  describe('a caller loaded from source', () => {
    it('VALID: {loadedFrom: /core/src/brokers/run/unit} => the source tree', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/src/brokers/run/unit' })).toStrictEqual({
        tree: 'source',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        compiler: '/core/bundled-typescript.js',
        interpretCaseModule: '/core/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/index',
      });
    });

    it('EDGE: {loadedFrom: /core/distant/src} => the source tree, since distant is not dist', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/distant/src' })).toStrictEqual({
        tree: 'source',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        compiler: '/core/bundled-typescript.js',
        interpretCaseModule: '/core/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/index',
      });
    });
  });

  describe('a caller loaded from dist', () => {
    it('VALID: {loadedFrom: /core/dist/src/brokers/run/unit} => the dist tree', () => {
      expect(
        coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/dist/src/brokers/run/unit' }),
      ).toStrictEqual({
        tree: 'dist',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        compiler: '/core/bundled-typescript.js',
        interpretCaseModule: '/core/dist/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/dist/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/dist/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/dist/index',
      });
    });

    it('EDGE: {loadedFrom: /core/dist} => the dist tree', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/dist' })).toStrictEqual({
        tree: 'dist',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        compiler: '/core/bundled-typescript.js',
        interpretCaseModule: '/core/dist/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/dist/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/dist/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/dist/index',
      });
    });
  });
});
