import { AssayerConfigStub } from '@assayer/shared/contracts';

import { configGenerateBroker } from './config-generate-broker';
import { configGenerateBrokerProxy } from './config-generate-broker.proxy';

describe('configGenerateBroker', () => {
  describe('no existing config in the target directory', () => {
    it('VALID: {configDir: "/repo"} => writes assayer.config.json with schema defaults and returns the parsed config', async () => {
      const proxy = configGenerateBrokerProxy();

      proxy.succeeds();

      const result = await configGenerateBroker({ configDir: '/repo' });

      expect(proxy.getWrittenPath()).toBe('/repo/assayer.config.json');
      expect(proxy.getWrittenContent()).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn","deadSurface":"error","runMode":"thorough"}',
      );
      expect(result).toStrictEqual(AssayerConfigStub());
    });
  });
});
