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
        interpretCaseModule: '/core/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
        resolveEntryModule: '/core/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
        probeRuntimeModule: '/core/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
        probeInjectModule: '/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
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
