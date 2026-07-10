import { fsExistsAdapter } from './fs-exists-adapter';
import { fsExistsAdapterProxy } from './fs-exists-adapter.proxy';

describe('fsExistsAdapter', () => {
  describe('existing path', () => {
    it('VALID: {existing path} => returns true', async () => {
      const proxy = fsExistsAdapterProxy();

      proxy.succeeds();

      await expect(fsExistsAdapter({ path: '/repo/a.ts' })).resolves.toBe(true);
    });
  });

  describe('missing path', () => {
    it('EMPTY: {missing path} => returns false', async () => {
      const proxy = fsExistsAdapterProxy();

      proxy.fails();

      await expect(fsExistsAdapter({ path: '/nope' })).resolves.toBe(false);
    });
  });
});
