import { AssayerConfigStub } from '@assayer/shared/contracts/assayer-config/assayer-config.stub';

import { configStableBranchSaveBroker } from './config-stable-branch-save-broker';
import { configStableBranchSaveBrokerProxy } from './config-stable-branch-save-broker.proxy';

describe('configStableBranchSaveBroker', () => {
  describe('writing a config with a stable branch override', () => {
    it('VALID: {configPath: "/repo/assayer.config.json", config: {stableBranch: "main"}} => writes the config JSON with stableBranch "main" and returns it', async () => {
      const proxy = configStableBranchSaveBrokerProxy();
      proxy.succeeds({ path: '/repo/assayer.config.json' });
      const config = AssayerConfigStub({ stableBranch: 'main' });

      const result = await configStableBranchSaveBroker({
        configPath: '/repo/assayer.config.json',
        config,
      });

      expect(proxy.getWrittenContentsFor({ path: '/repo/assayer.config.json' })).toStrictEqual([
        '{"version":"1","repoRoot":".","exclude":[],"stableBranch":"main","darkSpots":"warn","deadSurface":"error","inputGaps":"error","runMode":"thorough"}',
      ]);
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: '.',
        exclude: [],
        stableBranch: 'main',
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
        runMode: 'thorough',
      });
    });

    it('VALID: {config: {repoRoot: "./smoke-repo", exclude: ["dist"], stableBranch: "master"}} => writes every field without dropping any', async () => {
      const proxy = configStableBranchSaveBrokerProxy();
      proxy.succeeds({ path: '/repo/assayer.config.json' });
      const config = AssayerConfigStub({
        repoRoot: './smoke-repo',
        exclude: ['dist'],
        stableBranch: 'master',
      });

      const result = await configStableBranchSaveBroker({
        configPath: '/repo/assayer.config.json',
        config,
      });

      expect(proxy.getWrittenContentsFor({ path: '/repo/assayer.config.json' })).toStrictEqual([
        '{"version":"1","repoRoot":"./smoke-repo","exclude":["dist"],"stableBranch":"master","darkSpots":"warn","deadSurface":"error","inputGaps":"error","runMode":"thorough"}',
      ]);
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: './smoke-repo',
        exclude: ['dist'],
        stableBranch: 'master',
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
        runMode: 'thorough',
      });
    });
  });
});
