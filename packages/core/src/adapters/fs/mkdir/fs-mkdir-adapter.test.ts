import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';

describe('fsMkdirAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {path: "/repo/a/b/c"} => creates every missing parent directory and returns { success: true }', async () => {
      const proxy = fsMkdirAdapterProxy();

      proxy.succeeds();

      const result = await fsMkdirAdapter({ path: '/repo/a/b/c' });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getMkdirArgs()).toStrictEqual(['/repo/a/b/c', { recursive: true }]);
    });
  });

  describe('directory already exists', () => {
    it('EDGE: {path: "/repo/existing"} => returns { success: true } without throwing', async () => {
      const proxy = fsMkdirAdapterProxy();

      proxy.succeeds();

      const result = await fsMkdirAdapter({ path: '/repo/existing' });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
