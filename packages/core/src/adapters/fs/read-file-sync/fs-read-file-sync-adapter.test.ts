import { fsReadFileSyncAdapter } from './fs-read-file-sync-adapter';
import { fsReadFileSyncAdapterProxy } from './fs-read-file-sync-adapter.proxy';

describe('fsReadFileSyncAdapter', () => {
  describe('successful read', () => {
    it('VALID: {path} => returns the exact file text content', () => {
      const proxy = fsReadFileSyncAdapterProxy();

      proxy.returns({ content: 'hello world' });

      expect(fsReadFileSyncAdapter({ path: '/repo/a.ts' })).toBe('hello world');
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: missing file} => underlying fs error propagates unmodified', () => {
      const proxy = fsReadFileSyncAdapterProxy();

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      expect(() => fsReadFileSyncAdapter({ path: '/nope' })).toThrow(/^ENOENT: no such file or directory$/u);
    });
  });
});
