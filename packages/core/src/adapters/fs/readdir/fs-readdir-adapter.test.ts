import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';

describe('fsReaddirAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {path: "/repo/pkg"} => returns all three entries with isDirectory true only for the subdirectory', async () => {
      const proxy = fsReaddirAdapterProxy();
      proxy.returns({
        entries: [
          { name: 'a.ts', isDirectory: false },
          { name: 'b.ts', isDirectory: false },
          { name: 'sub', isDirectory: true },
        ],
      });

      const result = await fsReaddirAdapter({ path: '/repo/pkg' });

      expect(result).toStrictEqual([
        { name: 'a.ts', isDirectory: false },
        { name: 'b.ts', isDirectory: false },
        { name: 'sub', isDirectory: true },
      ]);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {path: "/repo/empty"} => returns an empty array', async () => {
      const proxy = fsReaddirAdapterProxy();
      proxy.returns({ entries: [] });

      const result = await fsReaddirAdapter({ path: '/repo/empty' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: missing directory} => underlying fs error propagates unmodified', async () => {
      const proxy = fsReaddirAdapterProxy();
      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReaddirAdapter({ path: '/repo/missing' })).rejects.toThrow(
        /^ENOENT: no such file or directory$/u
      );
    });
  });
});
