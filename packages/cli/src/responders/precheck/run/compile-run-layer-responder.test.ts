import { AssayerConfigStub } from '@assayer/shared/contracts/assayer-config/assayer-config.stub';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { ContentHashStub } from '@assayer/shared/contracts/content-hash/content-hash.stub';
import { FilePathStub } from '@assayer/core/contracts/file-path/file-path.stub';

import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

// The hash of AssayerConfigStub's version, repoRoot and sorted exclude list, the three fields the
// config hash covers.
const CONFIG_HASH = 'd8e6b6f238b6443622268e3a540f0aaeb5fa5432b0a14345182c7724ad901ac2';

describe('CompileRunLayerResponder', () => {
  describe('manifest invalid and compile succeeds', () => {
    it('VALID: {manifest invalid, compile ok} => trashes the stale cache, compiles, and writes a fresh manifest', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestInvalid({ configDir: '/repo' });
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo' });

      await expect(
        CompileRunLayerResponder({
          config: AssayerConfigStub(),
          configDir: FilePathStub({ value: '/repo' }),
          assayerVersion: ContentHashStub(),
        }),
      ).resolves.toBe(undefined);

      expect(proxy.getTrashCalls({ configDir: '/repo' })).toStrictEqual([
        ['/repo/.assayer/cache', { recursive: true, force: true }],
      ]);
      expect(proxy.wasManifestWritten({ configDir: '/repo' })).toBe(true);
    });
  });

  describe('compile reports errors', () => {
    it('ERROR: {compile reports one error} => throws CliExactOutputError with the formatted location and message', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestMissing({ configDir: '/repo' });
      proxy.compileFails({
        configDir: '/repo',
        root: '/repo',
        relPath: 'src/foo.ts',
        line: 10,
        column: 4,
        message: 'Unexpected token',
      });

      await expect(
        CompileRunLayerResponder({
          config: AssayerConfigStub(),
          configDir: FilePathStub({ value: '/repo' }),
          assayerVersion: ContentHashStub(),
        }),
      ).rejects.toThrow(new CliExactOutputError({ message: 'src/foo.ts:10:4 Unexpected token' }));
    });
  });

  describe('manifest already ok', () => {
    it('VALID: {manifest ok} => does not trash the cache, compiles, and writes the manifest', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestOk({
        configDir: '/repo',
        manifest: AssayerCacheManifestStub({ assayerVersion: ContentHashStub(), configHash: CONFIG_HASH }),
      });
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo' });

      await expect(
        CompileRunLayerResponder({
          config: AssayerConfigStub(),
          configDir: FilePathStub({ value: '/repo' }),
          assayerVersion: ContentHashStub(),
        }),
      ).resolves.toBe(undefined);

      expect(proxy.getTrashCalls({ configDir: '/repo' })).toStrictEqual([]);
      expect(proxy.wasManifestWritten({ configDir: '/repo' })).toBe(true);
    });
  });

  describe('manifest missing', () => {
    it('VALID: {manifest missing} => does not trash the cache, compiles, and writes the manifest', async () => {
      const proxy = CompileRunLayerResponderProxy();
      proxy.manifestMissing({ configDir: '/repo' });
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo' });

      await expect(
        CompileRunLayerResponder({
          config: AssayerConfigStub(),
          configDir: FilePathStub({ value: '/repo' }),
          assayerVersion: ContentHashStub(),
        }),
      ).resolves.toBe(undefined);

      expect(proxy.getTrashCalls({ configDir: '/repo' })).toStrictEqual([]);
      expect(proxy.wasManifestWritten({ configDir: '/repo' })).toBe(true);
    });
  });
});
