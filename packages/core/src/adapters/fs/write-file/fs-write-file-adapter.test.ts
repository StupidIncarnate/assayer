import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';

describe('fsWriteFileAdapter', () => {
  describe('successful write', () => {
    it('VALID: {path, content} => writes exactly that content to that path and returns { success: true }', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.succeeds({ path: '/repo/out.ts' });

      const result = await fsWriteFileAdapter({ path: '/repo/out.ts', content: 'export const x = 1;' });

      expect(result).toBeUndefined();
      expect(proxy.getWrittenPaths()).toStrictEqual(['/repo/out.ts']);
      expect(proxy.getWrittenContentFor({ path: '/repo/out.ts' })).toBe('export const x = 1;');
    });
  });

  describe('reading a write back by a partial path', () => {
    it('VALID: {three writes into one run directory} => the substring address answers with that file, not with the write that ran last', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.succeeds({ path: '/runs/r1/cases.json' });
      proxy.succeeds({ path: '/probes/abc.json' });
      proxy.succeeds({ path: '/runs/r1/assayer.test.js' });

      await fsWriteFileAdapter({ path: '/runs/r1/cases.json', content: '{"cases":[]}' });
      await fsWriteFileAdapter({ path: '/probes/abc.json', content: '{"probes":[]}' });
      await fsWriteFileAdapter({ path: '/runs/r1/assayer.test.js', content: 'require("x");' });

      expect(proxy.getWrittenContentMatching({ pathIncludes: 'cases.json' })).toBe('{"cases":[]}');
    });

    it('EMPTY: {a substring no written path contains} => answers undefined rather than the nearest write', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.succeeds({ path: '/runs/r1/cases.json' });

      await fsWriteFileAdapter({ path: '/runs/r1/cases.json', content: '{"cases":[]}' });

      expect(proxy.getWrittenContentMatching({ pathIncludes: 'nothing.json' })).toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: no permission to write} => underlying fs error propagates unmodified', async () => {
      const proxy = fsWriteFileAdapterProxy();

      proxy.denied({ path: '/repo/out.ts' });

      await expect(fsWriteFileAdapter({ path: '/repo/out.ts', content: 'export const x = 1;' })).rejects.toThrow(
        /^EACCES: op '\/repo\/out\.ts'$/u
      );
    });
  });
});
