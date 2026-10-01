import { manifestTrashBroker } from './manifest-trash-broker';
import { manifestTrashBrokerProxy } from './manifest-trash-broker.proxy';

describe('manifestTrashBroker', () => {
  describe('cache directory removal', () => {
    it('VALID: {configDir: "/repo" with an existing .assayer/cache dir} => removes .assayer/cache and resolves with nothing', async () => {
      const proxy = manifestTrashBrokerProxy();
      proxy.succeeds({ path: '/repo/.assayer/cache' });

      await manifestTrashBroker({ configDir: '/repo' });

      expect(proxy.getRmCalls({ path: '/repo/.assayer/cache' })).toStrictEqual([
        ['/repo/.assayer/cache', { recursive: true, force: true }],
      ]);
    });
  });
});
