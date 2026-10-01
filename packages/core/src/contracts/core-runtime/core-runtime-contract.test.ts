import { coreRuntimeContract } from './core-runtime-contract';
import { CoreRuntimeStub } from './core-runtime.stub';

describe('coreRuntimeContract', () => {
  describe('valid runtimes', () => {
    it('VALID: {stub default} => parses the source tree under /core', () => {
      const runtime = CoreRuntimeStub();

      expect(coreRuntimeContract.parse(runtime)).toStrictEqual({
        tree: 'source',
        setupFile: '/core/probe-runtime.js',
        astTransformer: '/core/probe-transformer.js',
        registrar: '/core/harness-registrar.js',
        compiler: '/core/bundled-typescript.js',
        resolver: '/core/ts-resolver.js',
        runner: '/core/run-jest.js',
        interpretCaseModule: '/core/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/index',
      });
    });
  });

  describe('invalid runtimes', () => {
    it('INVALID: {tree: "build"} => throws, since only source and dist are trees', () => {
      const runtime = CoreRuntimeStub();

      expect(() => {
        return coreRuntimeContract.parse({ ...runtime, tree: 'build' });
      }).toThrow(/"code": "invalid_value",\s+"values": \[\s+"source",\s+"dist"\s+\],\s+"path": \[\s+"tree"\s+\]/u);
    });

    it('INVALID: {setupFile: ""} => throws, since a path is never empty', () => {
      const runtime = CoreRuntimeStub();

      expect(() => {
        return coreRuntimeContract.parse({ ...runtime, setupFile: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
