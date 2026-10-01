import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';

describe('fsReadFileAdapter', () => {
  describe('successful read', () => {
    it('VALID: {path} => returns the exact file text content', async () => {
      const proxy = fsReadFileAdapterProxy();

      proxy.returns({ path: '/repo/a.ts', content: 'hello world' });

      await expect(fsReadFileAdapter({ path: '/repo/a.ts' })).resolves.toBe('hello world');
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: missing file} => underlying fs error propagates unmodified', async () => {
      const proxy = fsReadFileAdapterProxy();

      proxy.missing({ path: '/nope' });

      await expect(fsReadFileAdapter({ path: '/nope' })).rejects.toThrow(
        /^ENOENT: op '\/nope'$/u
      );
    });
  });
});
