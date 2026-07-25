import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';

describe('fsExistsSyncAdapter', () => {
  describe('a path on disk', () => {
    it('VALID: {an existing path} => true', () => {
      const proxy = fsExistsSyncAdapterProxy();
      proxy.exists();

      expect(fsExistsSyncAdapter({ path: '/repo/src/audit.harness.ts' })).toBe(true);
    });
  });

  describe('a path that is not there', () => {
    it('EMPTY: {a missing path} => false', () => {
      const proxy = fsExistsSyncAdapterProxy();
      proxy.missing();

      expect(fsExistsSyncAdapter({ path: '/repo/src/audit.harness.ts' })).toBe(false);
    });
  });
});
