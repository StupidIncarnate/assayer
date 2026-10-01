import { AssayerConfigStub } from '@assayer/shared/contracts/assayer-config/assayer-config.stub';

import { configGenerateBroker } from './config-generate-broker';
import { configGenerateBrokerProxy } from './config-generate-broker.proxy';

describe('configGenerateBroker', () => {
  describe('no existing config in the target directory', () => {
    it('VALID: {configDir: "/repo"} => writes assayer.config.json with schema defaults and returns the parsed config', async () => {
      const proxy = configGenerateBrokerProxy();

      proxy.succeeds({ path: '/repo/assayer.config.json' });

      const result = await configGenerateBroker({ configDir: '/repo' });

      expect(proxy.getCreatedDirsFor({ path: '/repo/assayer.config.json' })).toStrictEqual([
        ['/repo', { recursive: true }],
      ]);
      expect(proxy.getWrittenContentFor({ path: '/repo/assayer.config.json' })).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn","deadSurface":"error","inputGaps":"error","runMode":"thorough"}',
      );
      expect(result).toStrictEqual(AssayerConfigStub());
    });
  });
});
