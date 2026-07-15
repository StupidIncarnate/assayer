import { AssayerConfigStub } from '@assayer/shared/contracts';
import { filePathContract } from '@assayer/core/contracts';

import { PrecheckRunResponder } from './precheck-run-responder';
import { PrecheckRunResponderProxy } from './precheck-run-responder.proxy';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

describe('PrecheckRunResponder', () => {
  describe('all three layers succeed', () => {
    it('VALID: {valid repo} => returns the config directory and the resolved source root', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub();
      const configDir = filePathContract.parse('/repo');
      const configPath = filePathContract.parse('/repo/assayer.config.json');
      proxy.resolvesConfig({ config, configDir, configPath });
      proxy.stableReturns({ config });
      proxy.compileSucceeds();

      const result = await PrecheckRunResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        configDir: filePathContract.parse('/repo'),
        root: filePathContract.parse('/repo'),
      });
    });

    // The two are DIFFERENT whenever the config sets a repoRoot, and a caller that assumed one for
    // the other read source from the wrong tree.
    it('VALID: {a config with a repoRoot} => root resolves under configDir, which stays the cache home', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub({ repoRoot: './smoke-repo' });
      const configDir = filePathContract.parse('/repo');
      const configPath = filePathContract.parse('/repo/assayer.config.json');
      proxy.resolvesConfig({ config, configDir, configPath });
      proxy.stableReturns({ config });
      proxy.compileSucceeds();

      const result = await PrecheckRunResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        configDir: filePathContract.parse('/repo'),
        root: filePathContract.parse('/repo/smoke-repo'),
      });
    });

    it('VALID: {valid repo} => compile-run gets the config, its dir, and the analyzer fingerprint', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub();
      const configDir = filePathContract.parse('/repo');
      const configPath = filePathContract.parse('/repo/assayer.config.json');
      proxy.resolvesConfig({ config, configDir, configPath });
      proxy.stableReturns({ config });
      proxy.compileSucceeds();

      await PrecheckRunResponder({ repoPath: '/repo' });

      expect(proxy.getCompileRunArgs()).toStrictEqual({
        config,
        configDir,
        assayerVersion: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
    });
  });

  describe('config-resolve throws', () => {
    it('ERROR: {config-resolve throws} => the same CliExactOutputError propagates and neither stable-branch nor compile-run runs', async () => {
      const proxy = PrecheckRunResponderProxy();
      const message = 'assayer.config.json: invalid JSON at line 3 column 12: Expected double-quoted property name';
      proxy.throwsConfigError({ message });

      await expect(PrecheckRunResponder({ repoPath: '/repo' })).rejects.toThrow(new CliExactOutputError({ message }));
      expect(proxy.stableCallCount()).toBe(0);
      expect(proxy.compileCallCount()).toBe(0);
    });
  });
});
