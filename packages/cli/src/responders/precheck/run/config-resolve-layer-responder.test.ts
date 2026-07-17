import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { ConfigResolveLayerResponderProxy } from './config-resolve-layer-responder.proxy';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

describe('ConfigResolveLayerResponder', () => {
  describe('config found and valid', () => {
    it('VALID: {repoPath: "/repo", config found in repoPath itself} => returns the loaded config, configDir, and configPath without generating a new config', async () => {
      const proxy = ConfigResolveLayerResponderProxy();
      proxy.configLivesIn({ levelsBelow: 0 });
      proxy.hasContent({ content: '{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn"}' });

      const result = await ConfigResolveLayerResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        config: { version: '1', repoRoot: '.', exclude: [], darkSpots: 'warn' },
        configDir: '/repo',
        configPath: '/repo/assayer.config.json',
      });
    });
  });

  describe('no config found anywhere up to the filesystem root', () => {
    it('VALID: {repoPath: "/repo", no config found} => generates a default config in repoPath and returns it', async () => {
      const proxy = ConfigResolveLayerResponderProxy();
      proxy.neverFound();
      proxy.succeeds();

      const result = await ConfigResolveLayerResponder({ repoPath: '/repo' });

      expect(result).toStrictEqual({
        config: { version: '1', repoRoot: '.', exclude: [], darkSpots: 'warn' },
        configDir: '/repo',
        configPath: '/repo/assayer.config.json',
      });
      expect(proxy.getWrittenPath()).toBe('/repo/assayer.config.json');
    });
  });

  describe('config found but the file contains malformed JSON', () => {
    it('ERROR: {repoPath: "/repo", config file has malformed JSON} => throws CliExactOutputError with the pinpointed line/column and cleaned-up reason', async () => {
      const proxy = ConfigResolveLayerResponderProxy();
      proxy.configLivesIn({ levelsBelow: 0 });
      proxy.hasContent({ content: `{\n  "version": "1",\n${' '.repeat(11)}}` });

      await expect(ConfigResolveLayerResponder({ repoPath: '/repo' })).rejects.toThrow(
        new CliExactOutputError({
          message: 'assayer.config.json: invalid JSON at line 3 column 12: Expected double-quoted property name',
        }),
      );
    });
  });

  describe('config found but the parsed JSON fails schema validation', () => {
    it('ERROR: {repoPath: "/repo", config has repoRoot: 123} => throws CliExactOutputError with the formatted Zod issue', async () => {
      const proxy = ConfigResolveLayerResponderProxy();
      proxy.configLivesIn({ levelsBelow: 0 });
      proxy.hasContent({ content: '{"repoRoot": 123}' });

      await expect(ConfigResolveLayerResponder({ repoPath: '/repo' })).rejects.toThrow(
        new CliExactOutputError({ message: 'repoRoot: Expected string, received number' }),
      );
    });
  });
});
