import { AssayerConfigStub } from '@assayer/shared/contracts/assayer-config/assayer-config.stub';

import { PrecheckRunResponder } from './precheck-run-responder';
import { PrecheckRunResponderProxy } from './precheck-run-responder.proxy';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

// The hash of two analyzer source roots that each hold no files: sha256 of two empty-input hashes
// joined by a newline.
const ANALYZER_HASH = 'af60ab5be9ad4965eaa1059028902dc21b4b010385fbd5bfd03807f26e68aaf3';
// The hash of AssayerConfigStub's version, repoRoot and sorted exclude list.
const CONFIG_HASH = 'd8e6b6f238b6443622268e3a540f0aaeb5fa5432b0a14345182c7724ad901ac2';

describe('PrecheckRunResponder', () => {
  describe('all three layers succeed', () => {
    it('VALID: {valid repo} => returns the config directory and the resolved source root', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub();
      proxy.configAt({ configDir: '/repo', content: JSON.stringify(config) });
      proxy.notGitRepo();
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo' });

      const result = await PrecheckRunResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        configDir: '/repo',
        root: '/repo',
        config,
      });
    });

    // The two are DIFFERENT whenever the config sets a repoRoot, and a caller that assumed one for
    // the other read source from the wrong tree.
    it('VALID: {a config with a repoRoot} => root resolves under configDir, which stays the cache home', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub({ repoRoot: './smoke-repo' });
      proxy.configAt({ configDir: '/repo', content: JSON.stringify(config) });
      proxy.notGitRepo();
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo/smoke-repo' });

      const result = await PrecheckRunResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        configDir: '/repo',
        root: '/repo/smoke-repo',
        config,
      });
    });

    it('VALID: {valid repo} => the compile writes a manifest keyed on the config hash and the analyzer fingerprint', async () => {
      const proxy = PrecheckRunResponderProxy();
      const config = AssayerConfigStub();
      proxy.configAt({ configDir: '/repo', content: JSON.stringify(config) });
      proxy.notGitRepo();
      proxy.compileSucceeds({ configDir: '/repo', root: '/repo' });

      await PrecheckRunResponder({ repoPath: '/repo' });

      expect(proxy.getWrittenManifest({ configDir: '/repo' })).toStrictEqual({
        assayerVersion: ANALYZER_HASH,
        configHash: CONFIG_HASH,
        namespaces: { 'feature-x': { branch: 'feature-x', files: [] } },
        repoName: 'repo',
        rootFolderName: 'repo',
      });
    });
  });

  describe('config-resolve throws', () => {
    // Neither later layer has anything staged, so reaching either one would reject with an unstaged
    // call instead of this exact error.
    it('ERROR: {config file has malformed JSON} => the config layer error propagates and neither stable-branch nor compile-run runs', async () => {
      const proxy = PrecheckRunResponderProxy();
      proxy.configAt({ configDir: '/repo', content: `{\n  "version": "1",\n${' '.repeat(11)}}` });

      await expect(PrecheckRunResponder({ repoPath: '/repo' })).rejects.toThrow(
        new CliExactOutputError({
          message: 'assayer.config.json: invalid JSON at line 3 column 12: Expected double-quoted property name',
        }),
      );
      expect(proxy.wasManifestWritten({ configDir: '/repo' })).toBe(false);
    });
  });
});
