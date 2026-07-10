import { manifestTrashBroker } from './manifest-trash-broker';
import { manifestTrashBrokerProxy } from './manifest-trash-broker.proxy';

describe('manifestTrashBroker', () => {
  describe('cache directory removal', () => {
    it('VALID: {configDir: "/repo" with an existing .assayer/cache dir} => removes .assayer/cache and returns { success: true }', async () => {
      const proxy = manifestTrashBrokerProxy();
      proxy.succeeds();

      const result = await manifestTrashBroker({ configDir: '/repo' });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getRmArgs()).toStrictEqual([
        '/repo/.assayer/cache',
        { recursive: true, force: true },
      ]);
    });
  });
});
