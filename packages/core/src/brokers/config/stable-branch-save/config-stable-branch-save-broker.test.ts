import { AssayerConfigStub } from '@assayer/shared/contracts';

import { configStableBranchSaveBroker } from './config-stable-branch-save-broker';
import { configStableBranchSaveBrokerProxy } from './config-stable-branch-save-broker.proxy';

describe('configStableBranchSaveBroker', () => {
  describe('writing a config with a stable branch override', () => {
    it('VALID: {configPath: "/repo/assayer.config.json", config: {stableBranch: "main"}} => writes the config JSON with stableBranch "main" and returns it', async () => {
      const proxy = configStableBranchSaveBrokerProxy();
      proxy.succeeds();
      const config = AssayerConfigStub({ stableBranch: 'main' });

      const result = await configStableBranchSaveBroker({
        configPath: '/repo/assayer.config.json',
        config,
      });

      expect(proxy.getWrittenPath()).toBe('/repo/assayer.config.json');
      expect(proxy.getWrittenContent()).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"stableBranch":"main","darkSpots":"warn","deadSurface":"error"}'
      );
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: '.',
        exclude: [],
        stableBranch: 'main',
        darkSpots: 'warn',
        deadSurface: 'error',
      });
    });

    it('VALID: {config: {repoRoot: "./smoke-repo", exclude: ["dist"], stableBranch: "master"}} => writes every field without dropping any', async () => {
      const proxy = configStableBranchSaveBrokerProxy();
      proxy.succeeds();
      const config = AssayerConfigStub({
        repoRoot: './smoke-repo',
        exclude: ['dist'],
        stableBranch: 'master',
      });

      const result = await configStableBranchSaveBroker({
        configPath: '/repo/assayer.config.json',
        config,
      });

      expect(proxy.getWrittenContent()).toBe(
        '{"version":"1","repoRoot":"./smoke-repo","exclude":["dist"],"stableBranch":"master","darkSpots":"warn","deadSurface":"error"}'
      );
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: './smoke-repo',
        exclude: ['dist'],
        stableBranch: 'master',
        darkSpots: 'warn',
        deadSurface: 'error',
      });
    });
  });
});
