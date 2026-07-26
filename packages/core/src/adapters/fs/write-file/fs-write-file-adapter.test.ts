import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';

describe('fsWriteFileAdapter', () => {
  describe('successful write', () => {
    it('VALID: {path, content} => writes exactly that content to that path and returns { success: true }', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.succeeds();

      const result = await fsWriteFileAdapter({ path: '/repo/out.ts', content: 'export const x = 1;' });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenPath()).toBe('/repo/out.ts');
      expect(proxy.getWrittenContent()).toBe('export const x = 1;');
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: no permission to write} => underlying fs error propagates unmodified', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileAdapter({ path: '/repo/out.ts', content: 'export const x = 1;' })).rejects.toThrow(
        /^EACCES: permission denied$/u
      );
    });
  });
});
