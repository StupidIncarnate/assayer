import { AssayerConfigStub, AssayerCacheManifestStub, CompileResultStub } from '@assayer/shared/contracts';
import { FilePathStub } from '@assayer/core/contracts';

import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { AssayerVersionStub } from '../../../contracts/assayer-version/assayer-version.stub';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

describe('CompileRunLayerResponder', () => {
  describe('manifest invalid and compile succeeds', () => {
    it('VALID: {manifest invalid, compile ok} => trashes the stale manifest before compiling, then returns', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestInvalid();
      proxy.compileSucceeds();

      await CompileRunLayerResponder({
        config: AssayerConfigStub(),
        configDir: FilePathStub({ value: '/repo' }),
        assayerVersion: AssayerVersionStub({ value: '1.0.0' }),
      });

      expect(proxy.getCallOrder()).toStrictEqual(['trash', 'compile']);
    });
  });

  describe('compile reports errors', () => {
    it('ERROR: {compile reports one error} => throws CliExactOutputError with the formatted location and message', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestMissing();
      const { errors } = CompileResultStub({
        status: 'errors',
        results: [],
        errors: [{ namespace: 'main', relPath: 'src/foo.ts', line: 10, column: 4, message: 'Unexpected token' }],
      });
      proxy.compileFails({ errors });

      await expect(
        CompileRunLayerResponder({
          config: AssayerConfigStub(),
          configDir: FilePathStub({ value: '/repo' }),
          assayerVersion: AssayerVersionStub({ value: '1.0.0' }),
        }),
      ).rejects.toThrow(new CliExactOutputError({ message: 'src/foo.ts:10:4 Unexpected token' }));
    });
  });

  describe('manifest already ok', () => {
    it('VALID: {manifest ok} => does not trash the cache, compiles against the previous manifest, and returns', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestOk({ manifest: AssayerCacheManifestStub() });
      proxy.compileSucceeds();

      await CompileRunLayerResponder({
        config: AssayerConfigStub(),
        configDir: FilePathStub({ value: '/repo' }),
        assayerVersion: AssayerVersionStub({ value: '1.0.0' }),
      });

      expect(proxy.getCallOrder()).toStrictEqual(['compile']);
    });
  });

  describe('manifest missing', () => {
    it('VALID: {manifest missing} => does not trash the cache and returns after compiling', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestMissing();
      proxy.compileSucceeds();

      await CompileRunLayerResponder({
        config: AssayerConfigStub(),
        configDir: FilePathStub({ value: '/repo' }),
        assayerVersion: AssayerVersionStub({ value: '1.0.0' }),
      });

      expect(proxy.getCallOrder()).toStrictEqual(['compile']);
    });
  });
});
