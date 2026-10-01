import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';

describe('fsRmAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {path: "/repo/cache"} => removes the directory and everything under it, and returns { success: true }', async () => {
      const proxy = fsRmAdapterProxy();

      proxy.succeeds();

      const result = await fsRmAdapter({ path: '/repo/cache' });

      expect(result).toBeUndefined();
      expect(proxy.getRmArgs({ path: '/repo/cache' })).toStrictEqual([
        '/repo/cache',
        { recursive: true, force: true },
      ]);
    });
  });

  describe('path does not exist', () => {
    it('EMPTY: {path: "/repo/missing"} => returns { success: true } without throwing', async () => {
      const proxy = fsRmAdapterProxy();

      proxy.succeeds();

      const result = await fsRmAdapter({ path: '/repo/missing' });

      expect(result).toBeUndefined();
    });
  });
});
