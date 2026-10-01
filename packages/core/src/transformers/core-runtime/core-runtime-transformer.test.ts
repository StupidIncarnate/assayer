import { coreRuntimeTransformer } from './core-runtime-transformer';

describe('coreRuntimeTransformer', () => {
  describe('a caller loaded from source', () => {
    it('VALID: {loadedFrom: /core/src/brokers/run/unit} => the source tree', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/src/brokers/run/unit' })).toStrictEqual({
        tree: 'source',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        interpretCaseModule: '/core/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
        resolveEntryModule: '/core/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
        probeRuntimeModule: '/core/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
        probeInjectModule: '/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
        harnessModule: '/core/index',
      });
    });

    it('EDGE: {loadedFrom: /core/distant/src} => the source tree, since distant is not dist', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/distant/src' })).toStrictEqual({
        tree: 'source',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        interpretCaseModule: '/core/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
        resolveEntryModule: '/core/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
        probeRuntimeModule: '/core/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
        probeInjectModule: '/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
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
        interpretCaseModule: '/core/dist/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
        resolveEntryModule: '/core/dist/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
        probeRuntimeModule: '/core/dist/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
        probeInjectModule: '/core/dist/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
        harnessModule: '/core/dist/index',
      });
    });

    it('EDGE: {loadedFrom: /core/dist} => the dist tree', () => {
      expect(coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/dist' })).toStrictEqual({
        tree: 'dist',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        interpretCaseModule: '/core/dist/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
        resolveEntryModule: '/core/dist/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
        probeRuntimeModule: '/core/dist/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
        probeInjectModule: '/core/dist/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
        harnessModule: '/core/dist/index',
      });
    });
  });
});
